// Timing model for the SF16 vs BF16 race, from the Atreides RTL (superfloat.gpu, cf-openframe).
//
// Systolic PE pipelines:
//   SF16 (systolic_pe.sv): operand -> 15x15 multiply -> saturating accumulate. 3 stages, and the
//     accumulator closes in 1 cycle, so a PE can take a new term every cycle.
//   BF16 (fp_arith.sv, 5-stage PE): operand -> multiply + exponent add -> exponent compare + align
//     shift -> add -> normalize + round. The accumulate loop spans 3 cycles, so a PE can take a new
//     term for the same output only every third cycle.
// Clock: each PE hardened in the same SKY130 flow at a 20 ns target, worst corner. Period is the
//   data path that slack leaves: SF16 20 - 6.726 ns, BF16 20 - 5.902 ns.

export const UNITS = {
  sf16: {
    name: "SF16",
    format: "Q1.15",
    periodNs: 13.274,
    loop: 1,
    stages: [
      { name: "Operand registers", detail: "sign + 15-bit value" },
      { name: "Multiply", detail: "15 × 15, sign by XOR" },
      { name: "Accumulate", detail: "saturating add" },
    ],
  },
  bf16: {
    name: "BF16",
    format: "1 / 8 / 7",
    periodNs: 14.098,
    loop: 3,
    stages: [
      { name: "Operand registers", detail: "unpack, hidden bit" },
      { name: "Multiply", detail: "8 × 8, exponent add" },
      { name: "Align", detail: "exponent compare, barrel shift", exponent: true },
      { name: "Add", detail: "mantissa add" },
      { name: "Normalize + round", detail: "leading-zero count, shift, round to nearest even", exponent: true },
    ],
  },
};

export const ARRAY_N = 8;
export const ARRAY_K = 8;

export const mhz = (unit) => 1000 / unit.periodNs;

// One multiply-accumulate through the PE pipeline.
export const macLatencyNs = (unit) => unit.stages.length * unit.periodNs;

// The stage the operation is in at time t (ns), or the stage count once it has left the pipeline.
export const stageAt = (unit, tNs) => Math.min(unit.stages.length, Math.floor(tNs / unit.periodNs));

// Output-stationary N x N array computing an N x N x K matmul with skewed inputs, fed at full rate:
// PE[r, c] takes term k at cycle r + c + k * loop, and its output is ready a pipeline depth after its last term.
export const arrayCycles = (unit, n = ARRAY_N, k = ARRAY_K) => 2 * (n - 1) + (k - 1) * unit.loop + unit.stages.length;
export const arrayNs = (unit, n = ARRAY_N, k = ARRAY_K) => arrayCycles(unit, n, k) * unit.periodNs;

// Terms PE[r, c] has taken in by time t, whether one arrives this cycle, and whether its output is ready.
export function peAt(unit, r, c, tNs, k = ARRAY_K) {
  const cycle = tNs / unit.periodNs;
  const since = cycle - (r + c);
  const terms = since < 0 ? 0 : Math.min(k, Math.floor(since / unit.loop) + 1);
  const arriving = since >= 0 && since < (k - 1) * unit.loop + 1 && since % unit.loop < 1;
  const done = cycle >= r + c + (k - 1) * unit.loop + unit.stages.length;
  return { terms, arriving, done };
}

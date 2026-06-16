import { useState, useEffect, useRef, useCallback } from "react";

// ─── SF16 architectural constants (from systolic_pe.v / core.v) ──────────────
// SYSTOLIC_PE_VISIBLE_LATENCY = 9  (stages 0-8 inclusive, per core.v localparam)
// PIPE_INTERVAL               = 2  (per systolic_array.v parameter)
// SYSTOLIC_SIZE               = 16 (per core.v / gpu.v parameter)
// NUM_SYSTOLIC_ARRAYS         = 8  (per core.v / gpu.v parameter)
//
// SYSTOLIC_ARRAY_EXTRA_PIPE_STAGES = (SYSTOLIC_SIZE - 1) / 2 = 7
// SYSTOLIC_ARRAY_DRAIN_CYCLES      = SYSTOLIC_SIZE + PE_LATENCY + EXTRA = 16+9+7 = 32
//
// BF16 tensor-core latency:
//   MMA   (Tensor Core mma.sync)  = 16 cycles
//   WGMMA (Async warp-group mma)  = 32 cycles
//
// Speedup = BF16_latency / SF16_PE_latency
//   MMA  speedup = 16 / 9 ≈ 1.78x
//   WGMMA speedup= 32 / 9 ≈ 3.56x

const SF16_PE_LATENCY = 9;        // Verified from SYSTOLIC_PE_VISIBLE_LATENCY in core.v
const PIPE_INTERVAL   = 2;        // From systolic_array.v PIPE_INTERVAL parameter

// ─── deterministic mock matrices A & B ───────────────────────────────────────
const getAVal = (r, k) => 0.1 * ((r + k) % 5 + 1);
const getBVal = (r, c) => 0.05 * ((r % 4) + (c % 4) + 1);

function getAccumulatorValue(r_vis, c_vis, c_step, K_vis, N, M) {
  const t_start = r_vis + c_vis + Math.floor(r_vis / PIPE_INTERVAL) + Math.floor(c_vis / PIPE_INTERVAL);
  const k_accum = c_step - t_start + 1;
  if (k_accum <= 0) return 0.0;
  let sum = 0.0;
  const limit = Math.min(k_accum, K_vis);
  const p_r = Math.floor(r_vis * N / M);
  const p_c = Math.floor(c_vis * N / M);
  for (let i = 0; i < limit; i++) {
    sum += getAVal(p_r, i) * getBVal(i, p_c);
  }
  return sum;
}

// ─── formatting helpers ──────────────────────────────────────────────────────
function formatFrequency(hz) {
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(0)} GHz`;
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(0)} MHz`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(0)} kHz`;
  return `${hz} Hz`;
}

function formatFlops(flops, type) {
  const suffix = ` flops (${type})`;
  if (flops >= 1e12) return `${(flops / 1e12).toFixed(2)} T${suffix}`;
  if (flops >= 1e9)  return `${(flops / 1e9).toFixed(2)} G${suffix}`;
  if (flops >= 1e6)  return `${(flops / 1e6).toFixed(2)} M${suffix}`;
  if (flops >= 1e3)  return `${(flops / 1e3).toFixed(2)} k${suffix}`;
  return `${flops.toFixed(0)}${suffix}`;
}

function formatElapsedTime(seconds) {
  if (seconds < 1e-6) return `${(seconds * 1e9).toFixed(1)} ns`;
  if (seconds < 1e-3) return `${(seconds * 1e6).toFixed(1)} μs`;
  if (seconds < 1)    return `${(seconds * 1e3).toFixed(1)} ms`;
  return `${seconds.toFixed(3)} s`;
}

// ─── SVG animation components ────────────────────────────────────────────────
function pointAt(path, t) {
  if (path.length === 1) return path[0];
  const segLens = [];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1][0] - path[i][0];
    const dy = path[i + 1][1] - path[i][1];
    const l  = Math.sqrt(dx * dx + dy * dy);
    segLens.push(l);
    total += l;
  }
  let target = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i] || i === segLens.length - 1) {
      const frac = segLens[i] === 0 ? 0 : target / segLens[i];
      const cf   = Math.min(Math.max(frac, 0), 1);
      const [x1, y1] = path[i];
      const [x2, y2] = path[i + 1];
      return [x1 + (x2 - x1) * cf, y1 + (y2 - y1) * cf];
    }
    target -= segLens[i];
  }
  return path[path.length - 1];
}

function FlyingBadge({ path, t, label, color, M }) {
  const [x, y] = pointAt(path, t);
  const opacity = Math.sin(Math.PI * Math.min(Math.max(t, 0), 1));
  if (opacity <= 0.01) return null;

  if (M !== undefined && M >= 32) {
    const size = M >= 64 ? 4 : 6;
    return (
      <rect x={x - size / 2} y={y - size / 2} width={size} height={size}
        rx={size / 2} fill={color} style={{ opacity }} />
    );
  }

  const is16     = M === 16;
  const fontSize = is16 ? 7 : 10;
  const h        = is16 ? 14 : 22;
  const w        = is16 ? 32 : Math.max((label || "").length * 7 + 16, 50);
  const cleanLabel = is16 ? label.replace(/[AB]:/, "") : label;

  return (
    <g style={{ opacity }}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={is16 ? 2 : 4} fill={color} />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
        fontSize={fontSize} fontWeight={600} fontFamily="monospace" fill="white">
        {cleanLabel}
      </text>
    </g>
  );
}

function ValBadge({ cx, cy, value, bgColor }) {
  if (!value) return null;
  const w = Math.max((value || "").length * 7 + 16, 50);
  return (
    <g>
      <rect x={cx - w / 2} y={cy - 11} width={w} height={22} rx={4} fill={bgColor} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fontSize={10} fontWeight={600} fontFamily="monospace" fill="white">
        {value}
      </text>
    </g>
  );
}

function pathToD(path) {
  return path.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
}

function HighwayStreak({ path, index, speedTier, playing }) {
  const d       = pathToD(path);
  const baseDur = speedTier >= 2 ? 0.22 : 0.55;
  const kf      = `hwy${index}`;
  const dash    = 16; const gap = 16;
  return (
    <>
      <style>{`@keyframes ${kf} { from{stroke-dashoffset:${dash + gap}} to{stroke-dashoffset:0} }`}</style>
      <path d={d} fill="none" stroke="#64748b" strokeWidth={1.5} strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`}
        style={{ opacity: 0.5, animation: playing ? `${kf} ${baseDur}s linear infinite` : 'none' }} />
    </>
  );
}

function Highlight({ x, y, w, h, r, active, color, pulse }) {
  const pulseStyle = pulse && active
    ? { opacity: 0.9, animation: 'pulseGlow 0.4s ease-in-out infinite alternate' }
    : { opacity: active ? 0.8 : 0, transition: 'opacity 0.4s' };
  if (r) return <circle cx={r.cx} cy={r.cy} r={r.r} fill="none" stroke={color}
    strokeWidth={pulse && active ? 3.5 : 2.5} style={{ ...pulseStyle, color }} />;
  return <rect x={x} y={y} width={w} height={h} rx={6} fill="none" stroke={color}
    strokeWidth={pulse && active ? 3.5 : 2.5} style={{ ...pulseStyle, color }} />;
}

function ArrowDef() {
  return (
    <defs>
      <marker id="ah" viewBox="0 0 10 10" refX={8} refY={5}
        markerWidth={5} markerHeight={5} orient="auto-start-reverse">
        <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
          strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </marker>
      <filter id="highwayGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <style>{`
        @keyframes pulseGlow {
          from { opacity: 0.4; filter: drop-shadow(0 0 1px currentColor); }
          to   { opacity: 0.95; filter: drop-shadow(0 0 6px currentColor); }
        }
      `}</style>
    </defs>
  );
}

// ─── active PE count for systolic array ──────────────────────────────────────
// SF16 PE latency is SF16_PE_LATENCY cycles, so active window per PE is K cycles
const getActivePEsCount = (N, K, cur_step) => {
  if (cur_step < 0) return 0;
  let count = 0;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const t_start = r + c + Math.floor(r / PIPE_INTERVAL) + Math.floor(c / PIPE_INTERVAL);
      // Each PE is active for K SF16 cycles (one 9-cycle PE pipeline per input pair)
      const t_done  = K + r + c + Math.floor(r / PIPE_INTERVAL) + Math.floor(c / PIPE_INTERVAL);
      if (cur_step >= t_start && cur_step < t_done) count++;
    }
  }
  return count;
};

// ─── scalar FMA unit constants & helpers ──────────────────────────────────────
const R1  = { x: 120, y: 30,  w: 180, h: 70 };
const R2  = { x: 120, y: 430, w: 180, h: 70 };
const MUL = { cx: 210, cy: 245, r: 30 };
const XOR = { cx: 390, cy: 110, r: 26 };
const R3  = { x: 440, y: 210, w: 170, h: 70 };
const ADD = { cx: 730, cy: 300, r: 28 };
const R4  = { x: 440, y: 380, w: 170, h: 70 };

const R1cx = R1.x + R1.w / 2; const R1cy = R1.y + R1.h / 2;
const R2cx = R2.x + R2.w / 2; const R2cy = R2.y + R2.h / 2;
const R3cx = R3.x + R3.w / 2; const R3cy = R3.y + R3.h / 2;
const R4cx = R4.x + R4.w / 2; const R4cy = R4.y + R4.h / 2;

const fmaHighwayWires = [
  { path: [[46, R1cy], [R1.x, R1cy]],                                             tag: "r1_in"  },
  { path: [[46, R2cy], [R2.x, R2cy]],                                             tag: "r2_in"  },
  { path: [[R1cx, R1.y + R1.h], [R1cx, MUL.cy - MUL.r]],                         tag: "r1_mul" },
  { path: [[R2cx, R2.y], [R2cx, MUL.cy + MUL.r]],                                tag: "r2_mul" },
  { path: [[R1.x + R1.w, R1.y + 20], [XOR.cx, R1.y + 20], [XOR.cx, XOR.cy - XOR.r]], tag: "r1_xor" },
  { path: [[R2.x + R2.w, R2.y + 20], [390, R2.y + 20], [390, XOR.cy + XOR.r]],  tag: "r2_xor" },
  { path: [[MUL.cx + MUL.r, MUL.cy], [R3.x, R3cy]],                              tag: "mul_r3" },
  { path: [[XOR.cx + XOR.r, XOR.cy], [R3cx, XOR.cy], [R3cx, R3.y]],             tag: "xor_r3" },
  { path: [[R3.x + R3.w, R3cy], [ADD.cx, R3cy], [ADD.cx, ADD.cy - ADD.r]],      tag: "r3_add" },
  { path: [[ADD.cx, ADD.cy + ADD.r], [ADD.cx, R4cy - 10], [R4.x + R4.w, R4cy - 10]], tag: "add_r4" },
  { path: [[R4.x + R4.w, R4cy + 10], [775, R4cy + 10], [775, ADD.cy], [ADD.cx + ADD.r, ADD.cy]], tag: "r4_add" },
  { path: [[R4cx, R4.y + R4.h], [R4cx, 540]],                                    tag: "r4_out" },
];

// FMA pipeline has SF16_PE_LATENCY (9) stages — map step to per-stage data index
function getStageStateFMA(step, loadType, limit) {
  if (step < 0) return {};
  const maxData = (loadType === "fixed") ? limit : Infinity;
  // SF16 pipeline: 9 stages (0-8). Stage indices below index into the 9-stage pipe.
  // stages[si] = data index (di) currently in stage si
  const stages = {};
  for (let si = 0; si < SF16_PE_LATENCY; si++) {
    const di = step - si;
    if (di >= 0 && di < maxData) stages[si] = di;
  }
  // Visible pipeline display: show register state at key architectural stages
  // Stage 0 = R1/R2 input registration
  // Stage 1 = sign extraction + operand decomp
  // Stage 2 = nine parallel 5x5 sub-multiplies
  // Stage 3 = partial product alignment + first reduction
  // Stage 4 = second reduction
  // Stage 5 = product assembly pt1
  // Stage 6 = product assembly pt2 / Q1.15 extraction
  // Stage 7 = sign conversion (16-bit conditional negate)
  // Stage 8 = accumulation with saturation
  const c1di  = stages[0]; // just loaded into R1/R2
  const c2di  = stages[2]; // through sub-multiply stage
  const c3di  = stages[6]; // through product assembly
  const c3adi = stages[8]; // accumulated (stage 8)

  let accStr = "";
  if (c3adi !== undefined) {
    if (c3adi < 3) {
      for (let k = 0; k <= c3adi; k++) accStr += (k > 0 ? "+" : "") + `A${k+1}·W${k+1}`;
    } else {
      accStr = `∑ A_i·W_i (i=1..${c3adi+1})`;
    }
  }

  return {
    r1:  c1di  !== undefined ? `A${c1di+1}`             : null,
    r2:  c1di  !== undefined ? `W${c1di+1}`             : null,
    mul: c2di  !== undefined ? `A${c2di+1}×W${c2di+1}` : null,
    xor: c2di  !== undefined ? "sign XOR"               : null,
    r3:  c3di  !== undefined ? `A${c3di+1}·W${c3di+1}` : null,
    add: c3adi !== undefined ? `A${c3adi+1}·W${c3adi+1}`: null,
    r4:  c3adi !== undefined ? accStr                   : null,
    hlR1:  c1di  !== undefined,
    hlR2:  c1di  !== undefined,
    hlMul: c2di  !== undefined,
    hlXor: c2di  !== undefined,
    hlR3:  c3di  !== undefined,
    hlAdd: c3adi !== undefined,
    hlR4:  c3adi !== undefined,
  };
}

function getAccLabelFMA(index) {
  if (index < 0) return "";
  if (index < 3) {
    let s = "";
    for (let i = 0; i <= index; i++) s += (i > 0 ? "+" : "") + `A${i+1}·W${i+1}`;
    return s;
  }
  return `∑ A_i·W_i (i=1..${index+1})`;
}

function getActiveStagesCount(step, loadType, limit) {
  if (step < 0) return 0;
  const maxData = (loadType === "fixed") ? limit : Infinity;
  if (loadType === "fixed" && step >= limit + SF16_PE_LATENCY - 1) return 0;
  let count = 0;
  for (let si = 0; si < SF16_PE_LATENCY; si++) {
    const di = step - si;
    if (di >= 0 && di < maxData) count++;
  }
  return count;
}

// ─── main component ──────────────────────────────────────────────────────────
export default function FMAPipeline() {
  const [expanded,  setExpanded]  = useState(false);
  const [darkTheme, setDarkTheme] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setDarkTheme(document.documentElement.classList.contains("dark")));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const [step,            setStep]            = useState(-1);
  const [progress,        setProgress]        = useState(0);
  const [playing,         setPlaying]         = useState(false);
  const [freqExponent,    setFreqExponent]    = useState(0);
  const [compareMode,     setCompareMode]     = useState(false);
  const [latencyMode,     setLatencyMode]     = useState("mma");
  const [arraySize,       setArraySize]       = useState(16);
  const [fixedPreset,     setFixedPreset]     = useState("16");
  const [customLoadValue, setCustomLoadValue] = useState("64");
  const [loadType,        setLoadType]        = useState("fixed");
  const [peakSfops,       setPeakSfops]       = useState(0);
  const [peakBfops,       setPeakBfops]       = useState(0);

  const rafRef           = useRef(null);
  const lastTimeRef      = useRef(null);
  const playingRef       = useRef(false);
  const elapsedCyclesRef = useRef(0);
  const elapsedTimeRef   = useRef(0);

  const N = arraySize;

  // BF16 latency in clock cycles (tensor core instruction latency)
  const BF16_LATENCY = latencyMode === "wgmma" ? 32 : 16;

  // Real speedup: BF16 instruction latency / SF16 PE pipeline latency
  // SF16 PE does one multiply-accumulate in SF16_PE_LATENCY cycles.
  // BF16 tensor core issues one tile instruction every BF16_LATENCY cycles.
  const speedup = BF16_LATENCY / SF16_PE_LATENCY;

  // div: how many SF16 cycles elapse per 1 BF16 logical step
  // BF16 runs div times slower in terms of pipeline throughput
  const div = BF16_LATENCY / SF16_PE_LATENCY;

  const K = fixedPreset === "custom"
    ? (isNaN(parseInt(customLoadValue)) ? 16 : Math.max(1, parseInt(customLoadValue)))
    : parseInt(fixedPreset);

  const getLimitFMA = () => {
    if (loadType === "unlimited") return Infinity;
    if (fixedPreset === "custom") {
      const parsed = parseInt(customLoadValue);
      return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
    }
    return parseInt(fixedPreset);
  };
  const limitFMA = getLimitFMA();

  const frequency = Math.pow(10, freqExponent);

  // T_total: total logical steps for the systolic array to finish C = A×B
  // Includes skew + K accumulation + pipeline drain (PIPE_INTERVAL pipeline regs)
  const T_total = 2 * N + K + 2 * Math.floor((N - 1) / PIPE_INTERVAL);

  // BF16 runs div times slower: it needs div * T_total SF16-equivalent cycles
  const bf16Cycles_total = div * T_total;

  const maxCycles = compareMode
    ? bf16Cycles_total
    : (loadType === "unlimited" ? Infinity : limitFMA + SF16_PE_LATENCY - 1);

  // BF16 logical step: how far BF16 has advanced (lags behind by factor of div)
  const bf16LogicalStep = Math.max(0, Math.floor(step / div));

  const sf16Active = compareMode
    ? getActivePEsCount(N, K, step)
    : getActiveStagesCount(step, loadType, limitFMA);

  const bf16Active = compareMode
    ? getActivePEsCount(N, K, bf16LogicalStep)
    : 0;

  // SF16: 2 flops per MAC (multiply + accumulate), scaled by active PEs
  const liveSfops = compareMode ? frequency * sf16Active * 2 : frequency * sf16Active;
  // BF16: same 2 flops per MAC but at (frequency / BF16_LATENCY) effective throughput
  const liveBfops = compareMode ? (frequency / BF16_LATENCY) * bf16Active * 2 : 0;

  const completed_sf16_cycles = Math.min(T_total, Math.max(0, step));
  const completed_bf16_cycles = Math.min(T_total, Math.max(0, Math.floor(step / div)));

  const sf16Time = compareMode
    ? (completed_sf16_cycles / frequency) * (16 / (N * N))
    : (step < 0 ? 0 : Math.min(limitFMA + SF16_PE_LATENCY, step + 1) / frequency);

  const bf16Time = ((completed_bf16_cycles * div) / frequency) * (16 / (N * N));

  useEffect(() => { playingRef.current = playing; }, [playing]);

  useEffect(() => { if (liveSfops > peakSfops) setPeakSfops(liveSfops); }, [liveSfops, peakSfops]);
  useEffect(() => { if (liveBfops > peakBfops) setPeakBfops(liveBfops); }, [liveBfops, peakBfops]);

  const tick = useCallback((ts) => {
    if (!playingRef.current) return;
    if (!lastTimeRef.current) {
      lastTimeRef.current = ts;
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const deltaMs   = ts - lastTimeRef.current;
    lastTimeRef.current = ts;

    const freq       = Math.pow(10, freqExponent);
    const deltaCycles = deltaMs * (freq / 1000);
    const nextCycles  = elapsedCyclesRef.current + deltaCycles;

    let curMaxCycles = 0;
    if (!compareMode) {
      const limit = loadType === "fixed"
        ? (fixedPreset === "custom"
            ? (isNaN(parseInt(customLoadValue)) ? 1 : Math.max(1, parseInt(customLoadValue)))
            : parseInt(fixedPreset))
        : Infinity;
      curMaxCycles = limit + SF16_PE_LATENCY - 1;
    } else {
      const K_loc = fixedPreset === "custom"
        ? (isNaN(parseInt(customLoadValue)) ? 16 : Math.max(1, parseInt(customLoadValue)))
        : parseInt(fixedPreset);
      const bf16_lat  = latencyMode === "wgmma" ? 32 : 16;
      const div_loc   = bf16_lat / SF16_PE_LATENCY;
      const T_tot_loc = 2 * arraySize + K_loc + 2 * Math.floor((arraySize - 1) / PIPE_INTERVAL);
      curMaxCycles    = div_loc * T_tot_loc;
    }

    if (nextCycles >= curMaxCycles) {
      elapsedCyclesRef.current = curMaxCycles;
      elapsedTimeRef.current   = curMaxCycles / freq;
      setStep(curMaxCycles);
      setProgress(0);
      setPlaying(false);
      return;
    }

    elapsedCyclesRef.current = nextCycles;
    elapsedTimeRef.current  += deltaMs / 1000;

    const nextStep = Math.floor(nextCycles);
    setStep(nextStep);
    setProgress(nextCycles - nextStep);

    rafRef.current = requestAnimationFrame(tick);
  }, [freqExponent, arraySize, fixedPreset, customLoadValue, compareMode, latencyMode, loadType]);

  useEffect(() => {
    if (playing) {
      lastTimeRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, tick]);

  useEffect(() => {
    elapsedCyclesRef.current = 0;
    elapsedTimeRef.current   = 0;
    setStep(0);
    setPlaying(true);
  }, []);

  function togglePlay() {
    if (!playing) {
      if (step === -1 || step >= maxCycles) {
        elapsedCyclesRef.current = 0;
        elapsedTimeRef.current   = 0;
        setStep(0);
        setProgress(0);
        setPeakSfops(0);
        setPeakBfops(0);
      }
      lastTimeRef.current = performance.now();
    }
    setPlaying(p => !p);
  }

  function doReset() {
    setPlaying(false);
    cancelAnimationFrame(rafRef.current);
    setStep(-1);
    setProgress(0);
    elapsedCyclesRef.current = 0;
    elapsedTimeRef.current   = 0;
    lastTimeRef.current      = null;
    setPeakSfops(0);
    setPeakBfops(0);
  }

  function toggleCompareMode() {
    doReset();
    setCompareMode(prev => !prev);
  }

  // ─── style helpers ──────────────────────────────────────────────────────────
  const btnStyle = {
    fontSize: 13, fontWeight: 600, padding: "6px 16px", cursor: "pointer",
    border: darkTheme ? "1px solid #27272a" : "1px solid #cbd5e1", borderRadius: 6,
    background: darkTheme ? "#18181b" : "white",
    color: darkTheme ? "#f4f4f5" : "#334155",
    transition: "all 0.2s", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
  };
  const panelStyle = {
    display: "grid", gap: "16px",
    backgroundColor: darkTheme ? "#18181b" : "#f8fafc",
    border: darkTheme ? "1px solid #27272a" : "1px solid #e2e8f0",
    borderRadius: "8px", padding: "16px", marginBottom: "16px",
    boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.02)", transition: "all 0.5s ease-in-out",
  };
  const metricStyle = {
    display: "flex", flexDirection: "column", gap: "2px",
    minWidth: "130px", alignItems: "flex-start", transition: "all 0.5s ease-in-out",
  };
  const labelStyle = {
    fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em",
    color: darkTheme ? "#a1a1aa" : "#64748b", fontWeight: 600, transition: "all 0.3s ease",
  };
  const valueStyle = {
    fontSize: "17px", fontWeight: 700,
    color: darkTheme ? "#f4f4f5" : "#0f172a", fontFamily: "monospace",
  };
  const selectStyle = {
    fontSize: 13, padding: "5px 12px",
    border: darkTheme ? "1px solid #27272a" : "1px solid #cbd5e1", borderRadius: 6,
    backgroundColor: darkTheme ? "#18181b" : "white",
    color: darkTheme ? "#f4f4f5" : "#334155", cursor: "pointer", outline: "none",
  };
  const inputStyle = {
    fontSize: 13, padding: "5px 10px",
    border: darkTheme ? "1px solid #27272a" : "1px solid #cbd5e1", borderRadius: 6,
    backgroundColor: darkTheme ? "#18181b" : "white",
    color: darkTheme ? "#f4f4f5" : "#334155", outline: "none",
  };

  // ─── FMA flight badges (9-stage pipeline) ───────────────────────────────────
  const getFMAFlights = (ns, limitFMA, loadType, progress) => {
    const flights = [];
    if (ns >= 0) {
      const maxData = (loadType === "fixed") ? limitFMA : Infinity;
      // Show data tokens at key visible pipeline boundaries
      // si=0: R1/R2 load; si=2: post-multiply; si=6: post-product-assembly; si=8: accumulate
      const visibleStages = [0, 2, 6, 8];
      for (const si of visibleStages) {
        const di = ns - si;
        if (di < 0 || di >= maxData) continue;

        const aLabel   = `A${di + 1}`;
        const wLabel   = `W${di + 1}`;
        const mulLabel = `A${di + 1}×W${di + 1}`;
        const addLabel = `A${di + 1}·W${di + 1}`;

        if (si === 0) {
          flights.push({ path: [[24, R1cy], [R1cx, R1cy], [R1cx, R1.y + R1.h + 14]],
            label: aLabel, color: darkTheme ? "#3f3f46" : "#475569" });
          flights.push({ path: [[24, R2cy], [R2cx, R2cy], [R2cx, R2.y - 14]],
            label: wLabel, color: darkTheme ? "#71717a" : "#64748b" });
        } else if (si === 2) {
          flights.push({
            path: [[R1cx, R1.y + R1.h + 14], [R1cx, MUL.cy + MUL.r + 14]],
            label: aLabel, color: darkTheme ? "#3f3f46" : "#475569" });
          flights.push({
            path: [[R2cx, R2.y - 14], [R2cx, MUL.cy + MUL.r + 14]],
            label: wLabel, color: darkTheme ? "#71717a" : "#64748b" });
          flights.push({
            path: [[R1.x + R1.w, R1.y + 20], [XOR.cx, R1.y + 20], [XOR.cx, XOR.cy - XOR.r - 14]],
            label: "±", color: darkTheme ? "#52525b" : "#94a3b8" });
        } else if (si === 6) {
          flights.push({
            path: [[MUL.cx, MUL.cy + MUL.r + 14], [MUL.cx + MUL.r + 20, MUL.cy],
              [R3.x, R3cy], [R3cx, R3.y + R3.h + 14]],
            label: mulLabel, color: darkTheme ? "#27272a" : "#334155" });
          flights.push({
            path: [[XOR.cx, XOR.cy - XOR.r - 14], [XOR.cx + XOR.r, XOR.cy],
              [R3cx, XOR.cy], [R3cx, R3.y], [R3cx, R3.y + R3.h + 14]],
            label: "±", color: darkTheme ? "#52525b" : "#94a3b8" });
        } else if (si === 8) {
          flights.push({
            path: [[R3cx, R3.y + R3.h + 14], [R3.x + R3.w, R3cy], [ADD.cx, R3cy],
              [ADD.cx, ADD.cy - ADD.r], [ADD.cx - ADD.r - 44, ADD.cy],
              [ADD.cx, ADD.cy + ADD.r], [ADD.cx, R4cy - 10],
              [R4.x + R4.w, R4cy - 10], [R4cx, R4.y - 14]],
            label: addLabel, color: darkTheme ? "#3f3f46" : "#475569" });
          if (di >= 1) {
            flights.push({
              path: [[R4cx, R4.y - 14], [R4.x + R4.w, R4cy + 10], [775, R4cy + 10],
                [775, ADD.cy], [ADD.cx + ADD.r, ADD.cy], [ADD.cx - ADD.r - 44, ADD.cy]],
              label: getAccLabelFMA(di - 1), color: darkTheme ? "#18181b" : "#1e293b" });
          }
        }
      }
    }
    return flights;
  };

  const getWireColor = (tag) => {
    switch (tag) {
      case "r1_in": case "r1_mul": return darkTheme ? "#3f3f46" : "#475569";
      case "r2_in": case "r2_mul": return darkTheme ? "#71717a" : "#64748b";
      case "r1_xor": case "r2_xor": case "xor_r3": return darkTheme ? "#52525b" : "#94a3b8";
      case "mul_r3": case "add_r4": return darkTheme ? "#27272a" : "#334155";
      case "r3_add": return darkTheme ? "#3f3f46" : "#475569";
      case "r4_add": case "r4_out": return darkTheme ? "#18181b" : "#1e293b";
      default: return "#cbd5e1";
    }
  };

  // ─── render systolic array SVG ─────────────────────────────────────────────
  const renderArraySVG = (isBF16) => {
    // BF16 logical step lags by factor of div (BF16_LATENCY / SF16_PE_LATENCY)
    const div_local = isBF16 ? div : 1;
    const float_step = step + progress;
    const cur_logical_step_float = float_step / div_local;

    const M      = N;
    const K_vis  = K;
    const T_total_vis = 2 * M + K_vis + 2 * Math.floor((M - 1) / PIPE_INTERVAL);
    const c_step_float = cur_logical_step_float * T_total_vis / T_total;
    const c_step = Math.floor(c_step_float);

    const rowCenters = [];
    const colCenters = [];
    for (let r = 0; r < M; r++) rowCenters.push(120 + r * (380 / (M - 1)));
    for (let c = 0; c < M; c++) colCenters.push(200 + c * (450 / (M - 1)));

    const W_pe = Math.min(84, 450 / M - (M <= 16 ? 4 : 1));
    const H_pe = Math.min(60, 380 / M - (M <= 16 ? 4 : 1));
    const labelFontSize = Math.max(7, 10 * (W_pe / 84));

    const horizWires = rowCenters.map((cy) => ({ path: [[130, cy], [720, cy]], color: darkTheme ? "#3f3f46" : "#475569" }));
    const vertWires  = colCenters.map((cx) => ({ path: [[cx, 60], [cx, 550]], color: darkTheme ? "#71717a" : "#94a3b8" }));

    const flyingBadges = [];
    const d_h = 20; const d_v = 20;
    const max_vis_lines = M;

    for (let r = 0; r < max_vis_lines; r++) {
      const p_r  = Math.floor(r * N / M);
      const cy   = rowCenters[r];
      const offset = r + Math.floor(r / PIPE_INTERVAL);
      const k_start = Math.max(0, Math.floor(c_step_float - d_h - offset));
      const k_end   = Math.min(K_vis - 1, Math.ceil(c_step_float - offset));
      for (let k = k_start; k <= k_end; k++) {
        if (k % 4 !== 0) continue;
        const t_feed = k + offset;
        if (c_step_float >= t_feed && c_step_float < t_feed + d_h) {
          const t = (c_step_float - t_feed) / d_h;
          flyingBadges.push({
            key: `A-r${r}-slot-${(k / 4) % 8}`,
            path: [[130, cy], [720, cy]],
            t: Math.min(1, Math.max(0, t)),
            label: `A:${getAVal(p_r, k).toFixed(2)}`,
            color: darkTheme ? "#3f3f46" : "#475569",
          });
        }
      }
    }

    for (let c = 0; c < max_vis_lines; c++) {
      const cx   = colCenters[c];
      const p_c  = Math.floor(c * N / M);
      const offset = c + Math.floor(c / PIPE_INTERVAL);
      const k_start = Math.max(0, Math.floor(c_step_float - d_v - offset));
      const k_end   = Math.min(K_vis - 1, Math.ceil(c_step_float - offset));
      for (let k = k_start; k <= k_end; k++) {
        if (k % 4 !== 0) continue;
        const t_feed = k + offset;
        if (c_step_float >= t_feed && c_step_float < t_feed + d_v) {
          const t = (c_step_float - t_feed) / d_v;
          flyingBadges.push({
            key: `B-c${c}-slot-${(k / 4) % 8}`,
            path: [[cx, 60], [cx, 550]],
            t: Math.min(1, Math.max(0, t)),
            label: `B:${getBVal(k, p_c).toFixed(2)}`,
            color: darkTheme ? "#71717a" : "#94a3b8",
          });
        }
      }
    }

    const hColor = isBF16
      ? (darkTheme ? "#71717a" : "#64748b")
      : (darkTheme ? "#e4e4e7" : "#1e293b");

    // Subtitle shows the real latency numbers
    const arrayTitle = isBF16
      ? `BF16 Systolic Array (${latencyMode.toUpperCase()} — ${BF16_LATENCY} cycles/op)`
      : `SF16 Weight-Stationary Systolic Array (${SF16_PE_LATENCY} cycles/MAC)`;

    return (
      <svg viewBox="0 0 800 600" width="100%" role="img"
        aria-label={`${isBF16 ? "BF16" : "SF16"} Systolic Array Diagram`}
        style={{ display: "block", borderRadius: 10,
          border: darkTheme ? "1px solid #27272a" : "1px solid #e2e8f0",
          backgroundColor: darkTheme ? "#09090b" : "#ffffff" }}>
        <ArrowDef />
        <rect x={4} y={4} width={792} height={592} rx={10} fill="none"
          stroke={darkTheme ? "#27272a" : "#cbd5e1"} strokeWidth={1} />
        <text x={14} y={24} fontSize={12} fontWeight={700} fill={darkTheme ? "#a1a1aa" : "#475569"}>
          {arrayTitle}
        </text>

        {colCenters.map((cx, idx) => (
          <text key={`nh-${idx}`} x={cx} y={45} textAnchor="middle" fontSize={labelFontSize}
            fontWeight={600} fill={darkTheme ? "#71717a" : "#64748b"}>
            B_in[{Math.floor(idx * N / M)}]
          </text>
        ))}
        {rowCenters.map((cy, idx) => (
          <text key={`wh-${idx}`} x={120} y={cy} textAnchor="end" dominantBaseline="central"
            fontSize={labelFontSize} fontWeight={600} fill={darkTheme ? "#71717a" : "#64748b"}>
            A_in[{Math.floor(idx * N / M)}]
          </text>
        ))}

        {colCenters.map((cx, idx) => (
          <line key={`vwire-${idx}`} x1={cx} y1={60} x2={cx} y2={550}
            stroke={darkTheme ? "#27272a" : "#cbd5e1"} strokeWidth={M >= 32 ? 0.5 : 1.5} />
        ))}
        {rowCenters.map((cy, idx) => (
          <line key={`hwire-${idx}`} x1={130} y1={cy} x2={720} y2={cy}
            stroke={darkTheme ? "#27272a" : "#cbd5e1"} strokeWidth={M >= 32 ? 0.5 : 1.5} />
        ))}

        {freqExponent >= 4 && playing && (
          <>
            {vertWires.map((w, idx) => (
              <HighwayStreak key={`vhs-${idx}`} path={w.path} color={w.color}
                index={idx + (isBF16 ? 40 : 10)} speedTier={freqExponent >= 7 ? 2 : 1} playing={playing} />
            ))}
            {horizWires.map((w, idx) => (
              <HighwayStreak key={`hhs-${idx}`} path={w.path} color={w.color}
                index={idx + (isBF16 ? 50 : 20)} speedTier={freqExponent >= 7 ? 2 : 1} playing={playing} />
            ))}
          </>
        )}

        {rowCenters.map((cy, r) =>
          colCenters.map((cx, c) => {
            const p_r = Math.floor(r * N / M);
            const p_c = Math.floor(c * N / M);
            const t_start = r + c + Math.floor(r / PIPE_INTERVAL) + Math.floor(c / PIPE_INTERVAL);
            const t_end   = K_vis + r + c + Math.floor(r / PIPE_INTERVAL) + Math.floor(c / PIPE_INTERVAL);
            const isPEActive  = c_step >= t_start && c_step < t_end;
            const has_weight  = c_step >= t_start;
            const k_curr      = c_step - t_start;
            const b_val       = isPEActive ? getBVal(k_curr, p_c) : 0;
            const act_val     = isPEActive ? getAVal(p_r, k_curr) : 0;
            const acc_val     = getAccumulatorValue(r, c, c_step, K_vis, N, M);

            const getWELabel = () => {
              if (isPEActive) return b_val.toFixed(2);
              if (has_weight) return W_pe < 50 ? "I" : "Idle";
              return W_pe < 50 ? "" : "Empty";
            };
            const weLabel = getWELabel();
            const showAllText  = N <= 8;
            const showMicroText = N === 16;

            return (
              <g key={`pe-${r}-${c}`}>
                <rect
                  x={cx - W_pe / 2} y={cy - H_pe / 2} width={W_pe} height={H_pe}
                  rx={N >= 32 ? 1 : Math.max(2, 8 * (W_pe / 84))}
                  fill={isPEActive
                    ? (isBF16 ? (darkTheme ? "#27272a" : "#f1f5f9") : (darkTheme ? "#3f3f46" : "#e2e8f0"))
                    : has_weight ? (darkTheme ? "#18181b" : "#f8fafc")
                    : (darkTheme ? "#09090b" : "#ffffff")}
                  stroke={isPEActive ? hColor : has_weight ? (darkTheme ? "#3f3f46" : "#64748b") : (darkTheme ? "#27272a" : "#cbd5e1")}
                  strokeWidth={isPEActive ? (N >= 32 ? 1 : 2) : 1}
                  strokeDasharray={has_weight ? "none" : (N >= 32 ? "none" : "3,3")}
                  style={{ transition: "all 0.3s ease" }}
                />
                {showAllText && (
                  <>
                    <text x={cx - W_pe / 2 + 6} y={cy - H_pe / 2 + 8}
                      fontSize={Math.max(5, 8 * (W_pe / 84))} fontWeight={700}
                      fill={darkTheme ? "#71717a" : "#94a3b8"} fontFamily="monospace">
                      {p_r},{p_c}
                    </text>
                    <text x={cx} y={cy} fontSize={Math.max(6, 10 * (W_pe / 84))} fontWeight={700}
                      textAnchor="middle"
                      fill={has_weight ? (darkTheme ? "#ffffff" : "#1e293b") : (darkTheme ? "#71717a" : "#94a3b8")}>
                      {W_pe >= 50 && "W:"}{weLabel}
                    </text>
                    <text x={cx - W_pe / 2 + 6} y={cy + H_pe / 2 - 8}
                      fontSize={Math.max(5, 8 * (W_pe / 84))} fill={darkTheme ? "#a1a1aa" : "#64748b"}>
                      A:{isPEActive ? act_val.toFixed(1) : "—"}
                    </text>
                    <text x={cx + W_pe / 2 - 6} y={cy + H_pe / 2 - 8}
                      fontSize={Math.max(5, 8 * (W_pe / 84))} textAnchor="end"
                      fill={darkTheme ? "#d4d4d8" : "#475569"} fontWeight={600}>
                      {acc_val > 0 ? acc_val.toFixed(2) : "0.0"}
                    </text>
                  </>
                )}
                {showMicroText && (
                  <text x={cx} y={cy} fontSize={6} fontWeight={700} textAnchor="middle"
                    dominantBaseline="central"
                    fill={isPEActive ? (darkTheme ? "#ffffff" : "#1e293b") : (darkTheme ? "#a1a1aa" : "#475569")}>
                    {isPEActive ? b_val.toFixed(1) : (acc_val > 0 ? acc_val.toFixed(1) : "")}
                  </text>
                )}
                {N < 32 && (
                  <Highlight x={cx - W_pe / 2} y={cy - H_pe / 2} w={W_pe} h={H_pe}
                    active={isPEActive} color={hColor} pulse={playing && freqExponent >= 4} />
                )}
              </g>
            );
          })
        )}

        {freqExponent < 4 && flyingBadges.map((f) => (
          <FlyingBadge key={f.key} path={f.path} t={f.t} label={f.label} color={f.color} M={M} />
        ))}
      </svg>
    );
  };

  // ─── render FMA unit SVG (9-stage pipeline labels) ─────────────────────────
  const renderFMASVG = () => {
    const limitFMA_local = getLimitFMA();
    const stFMA  = getStageStateFMA(step, loadType, limitFMA_local);
    const ns     = step + 1;
    const flights = getFMAFlights(ns, limitFMA_local, loadType, progress);

    return (
      <svg viewBox="0 0 800 560" width="100%" role="img" aria-label="FMA pipeline diagram"
        style={{ display: "block", borderRadius: 10,
          border: darkTheme ? "1px solid #27272a" : "1px solid #e2e8f0",
          backgroundColor: darkTheme ? "#09090b" : "#ffffff" }}>
        <ArrowDef />
        <rect x={4} y={4} width={792} height={552} rx={10} fill="none"
          stroke={darkTheme ? "#27272a" : "#cbd5e1"} strokeWidth={1} />
        {/* Title with actual latency from Verilog */}
        <text x={14} y={22} fontSize={11} fill={darkTheme ? "#52525b" : "#aaa"}>
          Fused Multiply-Accumulate (FMA) Unit — SF16 · {SF16_PE_LATENCY}-stage pipeline
        </text>

        {/* Stage annotation strip */}
        {[
          { x: 210, label: "S0-1: Reg + Decomp" },
          { x: 390, label: "S2: 5×5 Muls" },
          { x: 525, label: "S3-6: Reduction + Assembly" },
          { x: 730, label: "S7-8: Sign + Acc" },
        ].map((s, i) => (
          <text key={i} x={s.x} y={548} textAnchor="middle" fontSize={8}
            fill={darkTheme ? "#3f3f46" : "#cbd5e1"} fontFamily="monospace">
            {s.label}
          </text>
        ))}

        {/* Inputs */}
        <rect x={16} y={R1cy - 18} width={30} height={36} rx={6} fill={darkTheme ? "#3f3f46" : "#475569"} />
        <text x={31} y={R1cy} textAnchor="middle" dominantBaseline="central"
          fontSize={14} fontWeight={700} fill="white">i</text>
        <line x1={46} y1={R1cy} x2={R1.x} y2={R1cy}
          stroke={darkTheme ? "#3f3f46" : "#475569"} strokeWidth={1.3} markerEnd="url(#ah)" />

        <rect x={16} y={R2cy - 18} width={30} height={36} rx={6} fill={darkTheme ? "#71717a" : "#64748b"} />
        <text x={31} y={R2cy} textAnchor="middle" dominantBaseline="central"
          fontSize={14} fontWeight={700} fill="white">j</text>
        <line x1={46} y1={R2cy} x2={R2.x} y2={R2cy}
          stroke={darkTheme ? "#71717a" : "#64748b"} strokeWidth={1.3} markerEnd="url(#ah)" />

        {/* R1 */}
        <rect x={R1.x} y={R1.y} width={R1.w} height={R1.h} rx={8} fill={darkTheme ? "#3f3f46" : "#475569"} />
        <text x={R1cx} y={R1.y + 22} textAnchor="middle" dominantBaseline="central"
          fontSize={14} fontWeight={500} fill="white">R1 (16 bit)</text>
        <text x={R1cx} y={R1.y + 42} textAnchor="middle" dominantBaseline="central"
          fontSize={11} fill={darkTheme ? "#cbd5e1" : "#B5D4F4"}>Input / Activation (i)</text>

        {/* R2 */}
        <rect x={R2.x} y={R2.y} width={R2.w} height={R2.h} rx={8} fill={darkTheme ? "#71717a" : "#64748b"} />
        <text x={R2cx} y={R2.y + 22} textAnchor="middle" dominantBaseline="central"
          fontSize={14} fontWeight={500} fill="white">R2 (16 bit)</text>
        <text x={R2cx} y={R2.y + 42} textAnchor="middle" dominantBaseline="central"
          fontSize={11} fill={darkTheme ? "#e2e8f0" : "#F5C4B3"}>Weight (j)</text>

        <line x1={R1cx} y1={R1.y + R1.h} x2={R1cx} y2={MUL.cy - MUL.r}
          stroke={darkTheme ? "#27272a" : "#888"} strokeWidth={0.9} markerEnd="url(#ah)" />
        <line x1={R2cx} y1={R2.y} x2={R2cx} y2={MUL.cy + MUL.r}
          stroke={darkTheme ? "#27272a" : "#888"} strokeWidth={0.9} markerEnd="url(#ah)" />

        {/* MUL — nine parallel 5×5 sub-multiplies (stage 2) */}
        <circle cx={MUL.cx} cy={MUL.cy} r={MUL.r} fill={darkTheme ? "#27272a" : "#334155"} />
        <text x={MUL.cx} y={MUL.cy} textAnchor="middle" dominantBaseline="central"
          fontSize={22} fontWeight={500} fill="white">×</text>

        <line x1={R1.x + R1.w} y1={R1.y + 20} x2={XOR.cx} y2={R1.y + 20}
          stroke={darkTheme ? "#27272a" : "#888"} strokeWidth={0.8} />
        <line x1={XOR.cx} y1={R1.y + 20} x2={XOR.cx} y2={XOR.cy - XOR.r}
          stroke={darkTheme ? "#27272a" : "#888"} strokeWidth={0.8} markerEnd="url(#ah)" />
        <line x1={R2.x + R2.w} y1={R2.y + 20} x2={390} y2={R2.y + 20}
          stroke={darkTheme ? "#27272a" : "#888"} strokeWidth={0.8} />
        <line x1={390} y1={R2.y + 20} x2={390} y2={XOR.cy + XOR.r}
          stroke={darkTheme ? "#27272a" : "#888"} strokeWidth={0.8} markerEnd="url(#ah)" />

        {/* XOR — sign bit (stage 1) */}
        <circle cx={XOR.cx} cy={XOR.cy} r={XOR.r} fill={darkTheme ? "#52525b" : "#94a3b8"} />
        <text x={XOR.cx} y={XOR.cy} textAnchor="middle" dominantBaseline="central"
          fontSize={12} fontWeight={500} fill="white">XOR</text>

        <line x1={XOR.cx + XOR.r} y1={XOR.cy} x2={R3cx} y2={XOR.cy}
          stroke={darkTheme ? "#27272a" : "#888"} strokeWidth={0.8} />
        <line x1={R3cx} y1={XOR.cy} x2={R3cx} y2={R3.y}
          stroke={darkTheme ? "#27272a" : "#888"} strokeWidth={0.8} markerEnd="url(#ah)" />
        <line x1={MUL.cx + MUL.r} y1={MUL.cy} x2={R3.x} y2={R3cy}
          stroke={darkTheme ? "#27272a" : "#334155"} strokeWidth={0.9} markerEnd="url(#ah)" />

        {/* R3 — partial product result (stages 3-6) */}
        <rect x={R3.x} y={R3.y} width={R3.w} height={R3.h} rx={8} fill={darkTheme ? "#3f3f46" : "#475569"} />
        <text x={R3cx} y={R3.y + 22} textAnchor="middle" dominantBaseline="central"
          fontSize={14} fontWeight={500} fill="white">R3 (16 bit)</text>
        <text x={R3cx} y={R3.y + 42} textAnchor="middle" dominantBaseline="central"
          fontSize={11} fill={darkTheme ? "#cbd5e1" : "#CECBF6"}>Mul + XOR result</text>

        {/* R4 — accumulator (stage 8) */}
        <rect x={R4.x} y={R4.y} width={R4.w} height={R4.h} rx={8} fill={darkTheme ? "#18181b" : "#1e293b"} />
        <text x={R4cx} y={R4.y + 22} textAnchor="middle" dominantBaseline="central"
          fontSize={14} fontWeight={500} fill="white">R4 (16 bit)</text>
        <text x={R4cx} y={R4.y + 42} textAnchor="middle" dominantBaseline="central"
          fontSize={11} fill={darkTheme ? "#71717a" : "#94a3b8"}>Accumulated sum</text>

        <line x1={R3.x + R3.w} y1={R3cy} x2={ADD.cx} y2={R3cy}
          stroke={darkTheme ? "#3f3f46" : "#475569"} strokeWidth={0.9} />
        <line x1={ADD.cx} y1={R3cy} x2={ADD.cx} y2={ADD.cy - ADD.r}
          stroke={darkTheme ? "#3f3f46" : "#475569"} strokeWidth={0.9} markerEnd="url(#ah)" />
        <line x1={R4.x + R4.w} y1={R4cy + 10} x2={775} y2={R4cy + 10}
          stroke={darkTheme ? "#18181b" : "#1e293b"} strokeWidth={0.9} />
        <line x1={775} y1={R4cy + 10} x2={775} y2={ADD.cy}
          stroke={darkTheme ? "#18181b" : "#1e293b"} strokeWidth={0.9} />
        <line x1={775} y1={ADD.cy} x2={ADD.cx + ADD.r} y2={ADD.cy}
          stroke={darkTheme ? "#18181b" : "#1e293b"} strokeWidth={0.9} markerEnd="url(#ah)" />

        {/* ADD — saturation accumulate (stage 8) */}
        <circle cx={ADD.cx} cy={ADD.cy} r={ADD.r} fill={darkTheme ? "#27272a" : "#334155"} />
        <text x={ADD.cx} y={ADD.cy} textAnchor="middle" dominantBaseline="central"
          fontSize={20} fontWeight={500} fill="white">+</text>

        <line x1={ADD.cx} y1={ADD.cy + ADD.r} x2={ADD.cx} y2={R4cy - 10}
          stroke={darkTheme ? "#27272a" : "#334155"} strokeWidth={0.9} />
        <line x1={ADD.cx} y1={R4cy - 10} x2={R4.x + R4.w} y2={R4cy - 10}
          stroke={darkTheme ? "#27272a" : "#334155"} strokeWidth={0.9} markerEnd="url(#ah)" />
        <line x1={R4cx} y1={R4.y + R4.h} x2={R4cx} y2={540}
          stroke={darkTheme ? "#18181b" : "#1e293b"} strokeWidth={1.3} markerEnd="url(#ah)" />

        {/* Highlights */}
        <Highlight x={R1.x-3} y={R1.y-3} w={R1.w+6} h={R1.h+6} active={stFMA.hlR1}  color={darkTheme ? "#a1a1aa" : "#475569"} pulse={playing && freqExponent >= 4} />
        <Highlight x={R2.x-3} y={R2.y-3} w={R2.w+6} h={R2.h+6} active={stFMA.hlR2}  color={darkTheme ? "#d4d4d8" : "#94a3b8"} pulse={playing && freqExponent >= 4} />
        <Highlight r={{ cx: MUL.cx, cy: MUL.cy, r: MUL.r + 5 }} active={stFMA.hlMul} color={darkTheme ? "#f4f4f5" : "#334155"} pulse={playing && freqExponent >= 4} />
        <Highlight r={{ cx: XOR.cx, cy: XOR.cy, r: XOR.r + 5 }} active={stFMA.hlXor} color={darkTheme ? "#d4d4d8" : "#94a3b8"} pulse={playing && freqExponent >= 4} />
        <Highlight x={R3.x-3} y={R3.y-3} w={R3.w+6} h={R3.h+6} active={stFMA.hlR3}  color={darkTheme ? "#a1a1aa" : "#475569"} pulse={playing && freqExponent >= 4} />
        <Highlight r={{ cx: ADD.cx, cy: ADD.cy, r: ADD.r + 5 }} active={stFMA.hlAdd} color={darkTheme ? "#f4f4f5" : "#334155"} pulse={playing && freqExponent >= 4} />
        <Highlight x={R4.x-3} y={R4.y-3} w={R4.w+6} h={R4.h+6} active={stFMA.hlR4}  color={darkTheme ? "#ffffff" : "#1e293b"} pulse={playing && freqExponent >= 4} />

        {/* Value Badges */}
        {freqExponent < 4 && (<>
          <ValBadge cx={R1cx} cy={R1.y + R1.h + 14}    value={stFMA.r1}  bgColor={darkTheme ? "#3f3f46" : "#475569"} />
          <ValBadge cx={R2cx} cy={R2.y - 14}            value={stFMA.r2}  bgColor={darkTheme ? "#71717a" : "#64748b"} />
          <ValBadge cx={MUL.cx} cy={MUL.cy + MUL.r + 14} value={stFMA.mul} bgColor={darkTheme ? "#27272a" : "#334155"} />
          <ValBadge cx={XOR.cx} cy={XOR.cy - XOR.r - 14} value={stFMA.xor} bgColor={darkTheme ? "#52525b" : "#94a3b8"} />
          <ValBadge cx={R3cx} cy={R3.y + R3.h + 14}    value={stFMA.r3}  bgColor={darkTheme ? "#3f3f46" : "#475569"} />
          <ValBadge cx={ADD.cx - ADD.r - 44} cy={ADD.cy} value={stFMA.add} bgColor={darkTheme ? "#27272a" : "#334155"} />
          <ValBadge cx={R4cx} cy={R4.y - 14}            value={stFMA.r4}  bgColor={darkTheme ? "#18181b" : "#1e293b"} />
        </>)}

        {freqExponent < 4
          ? flights.map((f, i) => (
              <FlyingBadge key={i} path={f.path} t={progress} label={f.label} color={f.color} />
            ))
          : playing && fmaHighwayWires.map((w, i) => (
              <HighwayStreak key={i} path={w.path} color={getWireColor(w.tag)}
                index={i} speedTier={freqExponent >= 7 ? 2 : 1} playing={playing} />
            ))
        }
      </svg>
    );
  };

  if (!expanded) {
    return (
      <div style={{ display: "flex", justifyContent: "center", margin: "40px 0" }}>
        <button onClick={() => setExpanded(true)}
          style={{
            fontSize: "15px", fontWeight: "600", padding: "12px 36px", cursor: "pointer",
            border: darkTheme ? "1px solid #27272a" : "1px solid #cbd5e1",
            borderRadius: "9999px",
            backgroundColor: darkTheme ? "#18181b" : "#ffffff",
            color: darkTheme ? "#f4f4f5" : "#334155",
            transition: "all 0.2s",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            display: "flex", alignItems: "center", gap: "8px",
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkTheme ? "#27272a" : "#f8fafc"; e.currentTarget.style.transform = "scale(1.03)"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = darkTheme ? "#18181b" : "#ffffff"; e.currentTarget.style.transform = "none"; }}
        >
          <span>See demo</span><span>→</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "sans-serif", maxWidth: compareMode ? 1600 : 820,
      margin: "24px auto", padding: "24px", position: "relative",
      borderRadius: "12px",
      border: darkTheme ? "1px solid #27272a" : "1px solid #e2e8f0",
      backgroundColor: darkTheme ? "#09090b" : "#ffffff",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
      transition: "all 0.3s ease",
    }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", color: darkTheme ? "#a1a1aa" : "#475569" }}>
          Superfloat Benchmark
        </span>
      </div>

      {/* Dashboard metrics */}
      <div style={{
        ...panelStyle,
        gridTemplateColumns: compareMode ? "repeat(auto-fit, minmax(200px, 1fr))" : "repeat(auto-fit, minmax(130px, 1fr))"
      }}>
        {!compareMode ? (
          <>
            <div style={metricStyle}>
              <span style={labelStyle}>Elapsed Time</span>
              <span style={valueStyle}>{formatElapsedTime(elapsedTimeRef.current)}</span>
            </div>
            <div style={metricStyle}>
              <span style={labelStyle}>Peak Performance</span>
              <span style={{ ...valueStyle, color: darkTheme ? "#a1a1aa" : "#2563eb" }}>{formatFlops(peakSfops, "sf16")}</span>
            </div>
          </>
        ) : (
          <>
            <div style={metricStyle}>
              {/* Real speedup: BF16_LATENCY / SF16_PE_LATENCY */}
              <span style={{ ...labelStyle, color: darkTheme ? "#a1a1aa" : "#16a34a" }}>
                SF16 MAC Latency Advantage
              </span>
              <span style={{ ...valueStyle, color: darkTheme ? "#ffffff" : "#16a34a" }}>
                {speedup.toFixed(2)}x
              </span>
            </div>
            <div style={metricStyle}>
              <span style={{ ...labelStyle, color: darkTheme ? "#a1a1aa" : "#2563eb" }}>SF16 Time</span>
              <span style={{ ...valueStyle, color: darkTheme ? "#d4d4d8" : "#2563eb", fontSize: "15px" }}>
                {formatElapsedTime(sf16Time)}
              </span>
            </div>
            <div style={metricStyle}>
              <span style={{ ...labelStyle, color: darkTheme ? "#a1a1aa" : "#2563eb" }}>SF16 Peak Perf</span>
              <span style={{ ...valueStyle, color: darkTheme ? "#d4d4d8" : "#2563eb" }}>{formatFlops(peakSfops, "sf16")}</span>
            </div>
            <div style={{ ...metricStyle, borderLeft: darkTheme ? "1px solid #27272a" : "1px solid #e2e8f0", paddingLeft: 16 }}>
              <span style={{ ...labelStyle, color: darkTheme ? "#a1a1aa" : "#8b5cf6" }}>BF16 Time</span>
              <span style={{ ...valueStyle, color: darkTheme ? "#d4d4d8" : "#8b5cf6", fontSize: "15px" }}>
                {formatElapsedTime(bf16Time)}
              </span>
            </div>
            <div style={metricStyle}>
              <span style={{ ...labelStyle, color: darkTheme ? "#a1a1aa" : "#8b5cf6" }}>BF16 Peak Perf</span>
              <span style={{ ...valueStyle, color: darkTheme ? "#d4d4d8" : "#8b5cf6" }}>{formatFlops(peakBfops, "bf16")}</span>
            </div>
          </>
        )}
      </div>

      {/* Control bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button onClick={togglePlay} style={btnStyle}>{playing ? "⏸ Pause" : "▶ Play"}</button>
          <button onClick={doReset}    style={btnStyle}>↺ Reset</button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginLeft: "auto" }}>
            {compareMode ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: darkTheme ? "#a1a1aa" : "#475569" }}>
                  <span style={{ fontWeight: 500 }}>BF16 Latency Mode:</span>
                  <select value={latencyMode} onChange={e => { setLatencyMode(e.target.value); doReset(); }} style={selectStyle}>
                    <option value="mma">Tensor Core MMA (16 cycles)</option>
                    <option value="wgmma">Async WGMMA (32 cycles)</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: darkTheme ? "#a1a1aa" : "#475569" }}>
                  <span style={{ fontWeight: 500 }}>Array Size (N):</span>
                  <select value={arraySize} onChange={e => { setArraySize(parseInt(e.target.value)); doReset(); }} style={selectStyle}>
                    <option value="4">4x4</option>
                    <option value="8">8x8</option>
                    <option value="16">16x16</option>
                    <option value="32">32x32</option>
                    <option value="64">64x64</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: darkTheme ? "#a1a1aa" : "#475569" }}>
                  <span style={{ fontWeight: 500 }}>Inner Dim (K):</span>
                  <select value={fixedPreset} onChange={e => { setFixedPreset(e.target.value); doReset(); }} style={selectStyle}>
                    <option value="16">16</option>
                    <option value="32">32</option>
                    <option value="64">64</option>
                    <option value="128">128</option>
                    <option value="256">256</option>
                    <option value="custom">Custom...</option>
                  </select>
                  {fixedPreset === "custom" && (
                    <input type="number" min={1} value={customLoadValue}
                      onChange={e => { setCustomLoadValue(e.target.value); doReset(); }}
                      style={{ ...inputStyle, width: 80 }} />
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: darkTheme ? "#a1a1aa" : "#475569" }}>
                  <span style={{ fontWeight: 500 }}>Load Type:</span>
                  <select value={loadType} onChange={e => { setLoadType(e.target.value); doReset(); }} style={selectStyle}>
                    <option value="fixed">Fixed Count</option>
                    <option value="unlimited">Unlimited (Infinite)</option>
                  </select>
                </div>
                {loadType === "fixed" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: darkTheme ? "#a1a1aa" : "#475569" }}>
                    <select value={fixedPreset} onChange={e => { setFixedPreset(e.target.value); doReset(); }} style={selectStyle}>
                      <option value="5">5 (Original)</option>
                      <option value="10">10</option>
                      <option value="1000">1,000</option>
                      <option value="1000000">1 Million (1M)</option>
                      <option value="1000000000">1 Billion (1B)</option>
                      <option value="1000000000000">1 Trillion (1T)</option>
                      <option value="custom">Custom...</option>
                    </select>
                    {fixedPreset === "custom" && (
                      <input type="number" min={1} value={customLoadValue}
                        onChange={e => { setCustomLoadValue(e.target.value); doReset(); }}
                        style={{ ...inputStyle, width: 100 }} />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 8, fontSize: 13,
          color: darkTheme ? "#a1a1aa" : "#475569", fontWeight: 500,
          borderTop: darkTheme ? "1px solid #27272a" : "1px solid #f1f5f9", paddingTop: 12
        }}>
          <span>Frequency:</span>
          <input type="range" min={0} max={9} step={1} value={freqExponent}
            onChange={e => { setFreqExponent(+e.target.value); lastTimeRef.current = null; }}
            style={{ width: 200, accentColor: darkTheme ? "#71717a" : "#2563eb", cursor: "pointer" }} />
          <span style={{ fontWeight: 600, color: darkTheme ? "#ffffff" : "#0f172a" }}>
            {formatFrequency(frequency)}
          </span>
        </div>
      </div>

      {/* Main SVG area */}
      <div style={{ display: "flex", gap: compareMode ? 24 : 0, alignItems: "stretch", overflow: "hidden", width: "100%" }}>
        <div style={{ flex: compareMode ? "1 1 50%" : "1 1 100%", minWidth: 0 }}>
          {compareMode ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: darkTheme ? "#a1a1aa" : "#64748b", marginBottom: 6 }}>
                Superfloat (SF16)
              </div>
              {renderArraySVG(false)}
            </>
          ) : renderFMASVG()}
        </div>

        {compareMode && (
          <div style={{
            flex: "1 1 50%", minWidth: 0,
            borderLeft: darkTheme ? "1px solid #27272a" : "1px solid #e2e8f0",
            paddingLeft: 24,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: darkTheme ? "#a1a1aa" : "#64748b", marginBottom: 6 }}>
              Bfloat16 (BF16) — {speedup.toFixed(2)}x slower than SF16
            </div>
            {renderArraySVG(true)}
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "24px" }}>
        <button onClick={toggleCompareMode} style={btnStyle}>
          {compareMode ? "Switch back to FMA" : "Switch to Systolic Array view"}
        </button>
      </div>
    </div>
  );
}
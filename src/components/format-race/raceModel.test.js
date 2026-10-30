import { ARRAY_K, ARRAY_N, UNITS, arrayCycles, arrayNs, macLatencyNs, mhz, peAt, stageAt } from "./raceModel";

// Small units with a 10 ns clock, so cycle boundaries land on exact numbers.
const fast = { periodNs: 10, loop: 1, stages: [{}, {}, {}] };
const looped = { periodNs: 10, loop: 3, stages: [{}, {}, {}, {}, {}] };
const at = (unit, cycle) => cycle * unit.periodNs;

test("units carry the RTL pipelines and the hardened clock periods", () => {
  const { sf16, bf16 } = UNITS;
  expect(sf16.format).toBe("Q1.15");
  expect(bf16.format).toBe("1 / 8 / 7");
  expect(sf16.stages.map((s) => s.name)).toEqual(["Operand registers", "Multiply", "Accumulate"]);
  expect(bf16.stages.map((s) => s.name)).toEqual(["Operand registers", "Multiply", "Align", "Add", "Normalize + round"]);
  expect(sf16.stages.every((s) => s.detail)).toBe(true);
  expect(bf16.stages.every((s) => s.detail)).toBe(true);
  // Only BF16's align and normalize stages are exponent hardware; SF16 has none.
  expect(sf16.stages.some((s) => s.exponent)).toBe(false);
  expect(bf16.stages.filter((s) => s.exponent).map((s) => s.name)).toEqual(["Align", "Normalize + round"]);
  expect([sf16.loop, bf16.loop]).toEqual([1, 3]);
  expect([ARRAY_N, ARRAY_K]).toEqual([8, 8]);
});

test("clock rate is the inverse of the period", () => {
  expect(mhz(UNITS.sf16)).toBeCloseTo(75.34, 2);
  expect(mhz(UNITS.bf16)).toBeCloseTo(70.93, 2);
  expect(mhz(fast)).toBe(100);
});

test("one MAC takes a pipeline depth of cycles", () => {
  expect(macLatencyNs(fast)).toBe(30);
  expect(macLatencyNs(looped)).toBe(50);
});

test("stageAt walks the pipeline one stage per cycle, then holds at the end", () => {
  expect(stageAt(fast, 0)).toBe(0);
  expect(stageAt(fast, 9.9)).toBe(0);
  expect(stageAt(fast, 10)).toBe(1);
  expect(stageAt(fast, 25)).toBe(2);
  expect(stageAt(fast, 30)).toBe(3);
  expect(stageAt(fast, 1000)).toBe(3);
  expect(stageAt(looped, 45)).toBe(4);
  expect(stageAt(looped, 1000)).toBe(5);
});

test("array time counts skew, the accumulate loop and the pipeline drain", () => {
  // 2(n-1) skew + (k-1) * loop + depth
  expect(arrayCycles(fast, 2, 1)).toBe(5);
  expect(arrayCycles(fast, 4, 3)).toBe(11);
  expect(arrayCycles(looped, 4, 2)).toBe(14);
  expect(arrayCycles(UNITS.bf16)).toBe(40);
  expect(arrayNs(fast, 2, 1)).toBe(50);
  expect(arrayNs(looped, 4, 2)).toBe(140);
  expect(arrayNs(UNITS.sf16)).toBeCloseTo(24 * 13.274, 6);
  expect(arrayNs(UNITS.bf16)).toBeCloseTo(40 * 14.098, 6);
});

test("a PE starts taking terms when the skewed inputs reach it", () => {
  // PE[2, 3] sees its first term at cycle 5.
  expect(peAt(fast, 2, 3, at(fast, 1)).terms).toBe(0); // well before: never a negative count
  expect(peAt(fast, 2, 3, at(fast, 4))).toEqual({ terms: 0, arriving: false, done: false });
  expect(peAt(fast, 2, 3, at(fast, 5))).toEqual({ terms: 1, arriving: true, done: false });
  expect(peAt(fast, 0, 0, 0)).toEqual({ terms: 1, arriving: true, done: false });
});

test("a full-rate PE takes one term a cycle, k in all, then drains", () => {
  expect(peAt(fast, 2, 3, at(fast, 12))).toEqual({ terms: 8, arriving: true, done: false });
  expect(peAt(fast, 2, 3, at(fast, 13))).toEqual({ terms: 8, arriving: false, done: false });
  // Output ready a pipeline depth after the last term: 5 + 7 + 3 = cycle 15.
  expect(peAt(fast, 2, 3, at(fast, 14.5)).done).toBe(false);
  expect(peAt(fast, 2, 3, at(fast, 15)).done).toBe(true);
  expect(peAt(fast, 0, 0, at(fast, 40))).toEqual({ terms: 8, arriving: false, done: true });
  expect(peAt(fast, 0, 0, at(fast, 2), 2).terms).toBe(2);
});

test("a looped PE takes a term only every third cycle", () => {
  expect(peAt(looped, 0, 0, at(looped, 1))).toEqual({ terms: 1, arriving: false, done: false });
  expect(peAt(looped, 0, 0, at(looped, 2.5)).arriving).toBe(false);
  expect(peAt(looped, 0, 0, at(looped, 3))).toEqual({ terms: 2, arriving: true, done: false });
  expect(peAt(looped, 0, 0, at(looped, 3.5)).arriving).toBe(true);
  expect(peAt(looped, 0, 0, at(looped, 21))).toEqual({ terms: 8, arriving: true, done: false });
  expect(peAt(looped, 0, 0, at(looped, 22)).arriving).toBe(false);
  // Last term at cycle 21, then five stages: ready at 26.
  expect(peAt(looped, 0, 0, at(looped, 25)).done).toBe(false);
  expect(peAt(looped, 0, 0, at(looped, 26)).done).toBe(true);
});

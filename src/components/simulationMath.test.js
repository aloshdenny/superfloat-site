import { getAccumulatorValue, normalizeWorkload } from "./simulationMath";

test("periodic accumulation matches direct arithmetic across partial periods", () => {
  for (const count of [0, 1, 19, 20, 21, 99, 1000]) {
    let expected = 0;
    for (let k = 0; k < count; k++) expected += 0.1 * ((3 + k) % 5 + 1) * 0.05 * ((k % 4) + (7 % 4) + 1);
    const start = 3 + 7 + Math.floor(3 / 2) + Math.floor(7 / 2);
    expect(getAccumulatorValue(3, 7, start + count - 1, count, 16, 16)).toBeCloseTo(expected, 8);
  }
  expect(Number.isFinite(getAccumulatorValue(0, 0, 1e12, 1e12, 16, 16))).toBe(true);
});

test("custom workloads stay finite and bounded", () => {
  expect(normalizeWorkload("1e99")).toBe(1e12);
  expect(normalizeWorkload("-4")).toBe(1);
  expect(normalizeWorkload("8.7")).toBe(8);
  expect(normalizeWorkload("invalid", 16)).toBe(16);
});

export const MAX_WORKLOAD = 1e12;

export function normalizeWorkload(value, fallback = 1) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(MAX_WORKLOAD, Math.max(1, Math.floor(number))) : fallback;
}

// The illustrative operands repeat every lcm(5, 4) = 20 products.
// Sum one period rather than iterating across a potentially trillion-item load.
export function getAccumulatorValue(row, col, step, innerDimension, size, visibleSize) {
  const start = row + col + Math.floor(row / 2) + Math.floor(col / 2);
  const count = Math.min(Math.max(0, Math.floor(step - start + 1)), innerDimension);
  const physicalRow = Math.floor(row * size / visibleSize);
  const physicalCol = Math.floor(col * size / visibleSize);
  const product = k => (0.1 * ((physicalRow + k) % 5 + 1)) * (0.05 * ((k % 4) + (physicalCol % 4) + 1));
  let period = 0, remainder = 0;
  for (let k = 0; k < 20; k++) {
    const value = product(k);
    period += value;
    if (k < count % 20) remainder += value;
  }
  return Math.floor(count / 20) * period + remainder;
}

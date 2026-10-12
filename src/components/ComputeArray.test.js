import { fireEvent, render, screen } from "@testing-library/react";
import ComputeArray from "./ComputeArray";

const matchMediaBefore = window.matchMedia;
const observerBefore = global.IntersectionObserver;
beforeEach(() => {
  window.matchMedia = jest.fn(() => ({ matches:false, addEventListener:jest.fn(), removeEventListener:jest.fn() }));
  global.IntersectionObserver = class { observe() {} disconnect() {} };
});
afterEach(() => { window.matchMedia = matchMediaBefore; global.IntersectionObserver = observerBefore; });

test("pointing at a PE traces its row of A and column of B", () => {
  const { container } = render(<ComputeArray />);
  fireEvent.pointerOver(container.querySelector('[data-r="8"][data-c="5"]'));
  expect(screen.getByText("C[8, 5] ← C[8, 5] + A[8, k] · B[k, 5]")).toBeInTheDocument();
  expect(container.querySelectorAll(".trace-a")).toHaveLength(5);
  expect(container.querySelectorAll(".trace-b")).toHaveLength(8);
  expect(container.querySelector('[data-r="8"][data-c="5"]')).toHaveClass("probe-cell");
});

test("arrow keys move the trace", () => {
  const { container } = render(<ComputeArray />);
  const grid = screen.getByRole("group");
  fireEvent.keyDown(grid, { key: "ArrowDown" });
  fireEvent.keyDown(grid, { key: "ArrowRight" });
  expect(container.querySelector('[data-r="4"][data-c="8"]')).toHaveClass("probe-cell");
});

test("respects a reduced-motion preference", () => {
  window.matchMedia = jest.fn(() => ({ matches:true, addEventListener:jest.fn(), removeEventListener:jest.fn() }));
  const { container } = render(<ComputeArray />);
  expect(container.firstChild).toHaveClass("motion-paused");
});

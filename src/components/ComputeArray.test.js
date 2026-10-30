import { act, fireEvent, render, screen } from "@testing-library/react";
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

test("the default trace is PE[3, 7], with the rest of its row and column marked", () => {
  const { container } = render(<ComputeArray />);
  expect(container.querySelectorAll(".signal-cell")).toHaveLength(256);
  expect(screen.getByText("C[3, 7] ← C[3, 7] + A[3, k] · B[k, 7]")).toBeInTheDocument();
  expect(screen.getByRole("group")).toHaveAttribute("aria-label", "Processing elements. Tracing PE[3, 7]; arrow keys move the trace.");
  expect(container.querySelectorAll(".probe-cell")).toHaveLength(1);
  expect(container.querySelectorAll(".trace-a")).toHaveLength(7);
  expect(container.querySelectorAll(".trace-b")).toHaveLength(3);
  expect(container.querySelectorAll(".probe-trace")).toHaveLength(8 + 12);
  expect(container.firstChild).not.toHaveClass("motion-paused");
});

test("operands take one hop per PE to reach the probe, and the array ripples diagonally", () => {
  const { container } = render(<ComputeArray />);
  const cell = (r, c) => container.querySelector(`[data-r="${r}"][data-c="${c}"]`).style;
  expect(cell(3, 7).getPropertyValue("--hop")).toBe("560ms"); // max(3, 7) + 1 hops of 70 ms
  expect(cell(3, 2).getPropertyValue("--hop")).toBe("140ms");
  expect(cell(1, 7).getPropertyValue("--hop")).toBe("70ms");
  expect(cell(10, 10).getPropertyValue("--hop")).toBe("0ms");
  expect(cell(0, 0).getPropertyValue("--phase")).toBe("-4000ms");
  expect(cell(2, 3).getPropertyValue("--phase")).toBe("-3575ms");
});

test("the trace stops at the array's edges and ignores other keys", () => {
  const { container } = render(<ComputeArray />);
  const grid = screen.getByRole("group");
  const probe = () => { const el = container.querySelector(".probe-cell"); return [el.dataset.r, el.dataset.c].map(Number); };
  for (let i = 0; i < 20; i++) { fireEvent.keyDown(grid, { key: "ArrowUp" }); fireEvent.keyDown(grid, { key: "ArrowLeft" }); }
  expect(probe()).toEqual([0, 0]);
  for (let i = 0; i < 20; i++) { fireEvent.keyDown(grid, { key: "ArrowDown" }); fireEvent.keyDown(grid, { key: "ArrowRight" }); }
  expect(probe()).toEqual([15, 15]);
  expect(fireEvent.keyDown(grid, { key: "ArrowUp" })).toBe(false); // handled: default scrolling prevented
  expect(fireEvent.keyDown(grid, { key: "Enter" })).toBe(true);
  expect(probe()).toEqual([14, 15]);
});

test("pressing a PE traces it; pointing between PEs changes nothing", () => {
  const { container } = render(<ComputeArray />);
  fireEvent.pointerDown(container.querySelector('[data-r="12"][data-c="0"]'));
  expect(screen.getByText("C[12, 0] ← C[12, 0] + A[12, k] · B[k, 0]")).toBeInTheDocument();
  fireEvent.pointerOver(screen.getByRole("group"));
  expect(container.querySelector('[data-r="12"][data-c="0"]')).toHaveClass("probe-cell");
});

test("the animation pauses off screen, in a hidden tab, and when motion is reduced later", () => {
  let onView;
  let onMotion;
  const media = { matches: false, addEventListener: jest.fn((_, cb) => { onMotion = cb; }), removeEventListener: jest.fn() };
  window.matchMedia = jest.fn(() => media);
  global.IntersectionObserver = class { constructor(cb) { onView = cb; } observe() {} disconnect() {} };
  const { container } = render(<ComputeArray />);
  const paused = () => container.firstChild.classList.contains("motion-paused");

  act(() => onView([{ isIntersecting: false }]));
  expect(paused()).toBe(true);
  act(() => onView([{ isIntersecting: true }]));
  expect(paused()).toBe(false);

  // Coming back to the tab re-measures whether the array is on screen.
  container.firstChild.getBoundingClientRect = () => ({ top: window.innerHeight + 10, bottom: window.innerHeight + 400 });
  act(() => { document.dispatchEvent(new Event("visibilitychange")); });
  expect(paused()).toBe(true);
  container.firstChild.getBoundingClientRect = () => ({ top: 10, bottom: 400 });
  act(() => { document.dispatchEvent(new Event("visibilitychange")); });
  expect(paused()).toBe(false);

  media.matches = true;
  act(() => onMotion());
  expect(paused()).toBe(true);
});

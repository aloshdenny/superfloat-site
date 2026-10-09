import { fireEvent, render, screen } from "@testing-library/react";
import ComputeArray from "./ComputeArray";

const matchMediaBefore = window.matchMedia;
const observerBefore = global.IntersectionObserver;
beforeEach(() => {
  window.matchMedia = jest.fn(() => ({ matches:false, addEventListener:jest.fn(), removeEventListener:jest.fn() }));
  global.IntersectionObserver = class { observe() {} disconnect() {} };
});
afterEach(() => { window.matchMedia = matchMediaBefore; global.IntersectionObserver = observerBefore; });

test("probing a cell updates its operands and animation can be paused", () => {
  const { container } = render(<ComputeArray />);
  fireEvent.click(screen.getByRole("button", { name:"PE[8,8]" }));
  expect(screen.getByText("C[8,8]")).toBeInTheDocument();
  expect(screen.getByText("0.020")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name:"Pause array animation" }));
  expect(container.firstChild).toHaveClass("motion-paused");
  fireEvent.click(screen.getByRole("button", { name:"Resume array animation" }));
  expect(container.firstChild).not.toHaveClass("motion-paused");
});

test("respects a reduced-motion preference", () => {
  window.matchMedia = jest.fn(() => ({ matches:true, addEventListener:jest.fn(), removeEventListener:jest.fn() }));
  const { container } = render(<ComputeArray />);
  expect(container.firstChild).toHaveClass("motion-paused");
  expect(screen.getByText("REDUCED MOTION")).toBeDisabled();
});

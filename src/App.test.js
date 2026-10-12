import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FormatRace from "./components/format-race/FormatRace";
import { UNITS, arrayCycles, macLatencyNs } from "./components/format-race/raceModel";
import FormatExplorer from "./components/FormatExplorer";

const matchMediaBefore = window.matchMedia;
const observerBefore = global.IntersectionObserver;
beforeEach(() => {
  window.matchMedia = jest.fn(() => ({ matches:true, addEventListener:jest.fn(), removeEventListener:jest.fn() }));
  global.IntersectionObserver = class { observe() {} disconnect() {} };
});
afterEach(() => { window.matchMedia = matchMediaBefore; global.IntersectionObserver = observerBefore; });

test("race model follows the RTL pipelines", () => {
  expect(UNITS.sf16.stages).toHaveLength(3);
  expect(UNITS.bf16.stages).toHaveLength(5);
  expect(macLatencyNs(UNITS.sf16)).toBeCloseTo(39.8, 1);
  expect(macLatencyNs(UNITS.bf16)).toBeCloseTo(70.5, 1);
  expect(arrayCycles(UNITS.sf16)).toBe(24);
  expect(arrayCycles(UNITS.bf16)).toBe(40);
});

test("the race card shows both units and flips to the arrays", () => {
  const { container } = render(<FormatRace />);
  expect(screen.getAllByText("SF16").length).toBeGreaterThan(0);
  expect(screen.getAllByText("EXPONENT")).toHaveLength(2);
  expect(screen.getByText("39.8 ns")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Flip to the systolic arrays" }));
  expect(container.firstChild).toHaveClass("is-flipped");
  fireEvent.click(screen.getByRole("button", { name: "Flip back to the FMA units" }));
  expect(container.firstChild).not.toHaveClass("is-flipped");
});

test("precision presets update ideal packed storage", () => {
  render(<FormatExplorer />);
  fireEvent.click(screen.getByRole("button", { name: "Superfloat" }));
  fireEvent.click(screen.getByRole("button", { name: "SF4", exact: true }));
  expect(screen.getByText("0.50 MB")).toBeInTheDocument();
  expect(screen.getByText("75%")).toBeInTheDocument();
});

test("switches between BF16 and scalable Superfloat widths", async () => {
  render(<FormatExplorer />);

  expect(screen.getByText("BF16 · 1 / 8 / 7")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Superfloat" }));
  fireEvent.change(screen.getByRole("slider", { name: /superfloat precision/i }), { target: { value: "8" } });

  expect(screen.getByText("SF8 · 1 / 7")).toBeInTheDocument();
  expect(screen.getByText("Unused")).toBeInTheDocument();
});

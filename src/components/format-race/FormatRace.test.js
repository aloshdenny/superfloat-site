import { act, fireEvent, render, screen } from "@testing-library/react";
import FormatRace from "./FormatRace";

const matchMediaBefore = window.matchMedia;
const observerBefore = global.IntersectionObserver;
const rafBefore = [window.requestAnimationFrame, window.cancelAnimationFrame];
let reduced;
let setInView;
let frames;

beforeEach(() => {
  reduced = false;
  frames = [];
  window.matchMedia = jest.fn(() => ({ matches: reduced, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  global.IntersectionObserver = class {
    constructor(callback) { setInView = (isIntersecting) => act(() => callback([{ isIntersecting }])); }
    observe() {}
    disconnect() {}
  };
  window.requestAnimationFrame = (cb) => frames.push(cb);
  window.cancelAnimationFrame = jest.fn();
});
afterEach(() => {
  window.matchMedia = matchMediaBefore;
  global.IntersectionObserver = observerBefore;
  [window.requestAnimationFrame, window.cancelAnimationFrame] = rafBefore;
});

// Runs the next animation frame at `now` ms.
const frame = (now) => act(() => frames.shift()(now));
const lane = (name) => screen.getByText(name, { selector: ".race__front .lane__name" }).closest(".lane");
const arrayLane = (name) => screen.getByText(name, { selector: ".race__back .lane__name" }).closest(".lane");
const flip = () => fireEvent.click(screen.getByRole("button", { name: "Flip to the systolic arrays" }));

test("each lane names its format, clock and pipeline depth", () => {
  render(<FormatRace />);
  expect(lane("SF16")).toHaveTextContent("Q1.15 · 75.3 MHz · 3 stages");
  expect(lane("BF16")).toHaveTextContent("1 / 8 / 7 · 70.9 MHz · 5 stages");
  expect(screen.getByRole("img", { name: "SF16 multiply-accumulate datapath, 3 pipeline stages" })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "BF16 multiply-accumulate datapath, 5 pipeline stages" })).toBeInTheDocument();
  expect(lane("SF16").querySelectorAll(".fd-band")).toHaveLength(3);
  expect(lane("BF16").querySelectorAll(".fd-band.is-exponent")).toHaveLength(2);
  expect(lane("SF16").querySelectorAll(".is-exponent")).toHaveLength(0);
});

test("before it is on screen the race waits at the first stage", () => {
  render(<FormatRace />);
  expect(lane("SF16")).toHaveTextContent("0.0 ns");
  expect(lane("SF16")).toHaveTextContent("STAGE 1 / 3");
  expect(lane("BF16")).toHaveTextContent("STAGE 1 / 5");
  const bands = [...lane("SF16").querySelectorAll(".fd-band")];
  expect(bands.map((b) => b.classList.contains("is-active"))).toEqual([true, false, false]);
  expect(frames).toHaveLength(0);
});

test("on screen, the race clock runs both MACs to the finish, holds, then starts over", () => {
  render(<FormatRace />);
  setInView(true);
  frame(1000); // the first frame sets the start
  frame(1000 + 20 * 50); // 20 ns later at 50 ms per ns
  expect(lane("SF16")).toHaveTextContent("20.0 ns");
  expect(lane("SF16")).toHaveTextContent("STAGE 2 / 3");
  expect(lane("BF16")).toHaveTextContent("STAGE 2 / 5");
  expect([...lane("SF16").querySelectorAll(".fd-band")].map((b) => b.getAttribute("class").trim())).toEqual(["fd-band is-past", "fd-band is-active", "fd-band"]);

  frame(1000 + 45 * 50); // SF16 (39.8 ns) is done, BF16 (70.5 ns) is not
  expect(lane("SF16")).toHaveTextContent("39.8 ns");
  expect(lane("SF16")).toHaveTextContent("DONE");
  expect(lane("BF16")).toHaveTextContent("45.0 ns");
  expect(lane("BF16")).toHaveTextContent("STAGE 4 / 5");

  frame(1000 + 80 * 50); // past the end: both clocks stop at the slower unit's finish
  expect(lane("BF16")).toHaveTextContent("70.5 ns");
  expect(lane("BF16")).toHaveTextContent("DONE");

  frame(1000 + 70.49 * 50 + 2400 + 10); // after the hold the race restarts
  expect(lane("SF16")).toHaveTextContent("0.0 ns");
  expect(lane("SF16")).toHaveTextContent("STAGE 1 / 3");
});

test("going off screen stops the clock", () => {
  render(<FormatRace />);
  setInView(true);
  expect(frames).toHaveLength(1);
  setInView(false);
  expect(window.cancelAnimationFrame).toHaveBeenCalled();
  expect(lane("SF16")).toHaveTextContent("0.0 ns");
});

test("with reduced motion the race is shown finished, with its stats", () => {
  reduced = true;
  render(<FormatRace />);
  expect(lane("SF16")).toHaveTextContent("39.8 nsDONE");
  expect(lane("BF16")).toHaveTextContent("70.5 nsDONE");
  expect(screen.getByText("1.8×", { selector: ".race__front strong" })).toBeInTheDocument();
  expect(screen.getByText("39.8 vs 70.5 ns")).toBeInTheDocument();
  expect(frames).toHaveLength(0);
});

test("the back face races two 8 × 8 arrays, one term a cycle against one every three", () => {
  render(<FormatRace />);
  flip();
  expect(document.querySelector(".race__front")).toHaveAttribute("aria-hidden", "true");
  expect(document.querySelector(".race__back")).toHaveAttribute("aria-hidden", "false");
  expect(arrayLane("SF16")).toHaveTextContent("8 × 8 PEs · new term every cycle");
  expect(arrayLane("BF16")).toHaveTextContent("8 × 8 PEs · new term every 3 cycles");
  expect(arrayLane("SF16")).toHaveTextContent("CYCLE 0 / 24");
  expect(arrayLane("BF16")).toHaveTextContent("CYCLE 0 / 40");
  expect(arrayLane("SF16").querySelectorAll(".lane__grid i")).toHaveLength(64);
  // At t = 0 only PE[0, 0] has its first term arriving.
  expect(arrayLane("SF16").querySelectorAll(".is-arriving")).toHaveLength(1);
  expect(screen.getByText("319 vs 564 ns")).toBeInTheDocument();
  expect(screen.getByText("1 vs 3")).toBeInTheDocument();
  // The front face, out of view, shows its finished state.
  expect(lane("SF16")).toHaveTextContent("DONE");
});

test("the array race fills every PE and finishes", () => {
  reduced = true;
  render(<FormatRace />);
  flip();
  expect(arrayLane("SF16").querySelectorAll(".lane__grid .is-done")).toHaveLength(64);
  expect(arrayLane("BF16").querySelectorAll(".lane__grid .is-done")).toHaveLength(64);
  expect(arrayLane("SF16")).toHaveTextContent("319 nsDONE");
  expect(arrayLane("BF16")).toHaveTextContent("564 nsDONE");
  expect(arrayLane("SF16").querySelector(".lane__grid i").style.getPropertyValue("--level")).toBe("1");
});

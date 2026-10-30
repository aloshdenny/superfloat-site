import { fireEvent, render, screen } from "@testing-library/react";
import FormatExplorer from "./FormatExplorer";

// The role each bit plays, most significant first, read from the bits' accessible labels.
const fields = (container) => [...container.querySelectorAll(".format-explorer__bit")].map((bit) => bit.getAttribute("aria-label").split(", ")[1]);
const repeat = (role, n) => Array(n).fill(role);
const pressed = (name) => screen.getByRole("button", { name, exact: true }).getAttribute("aria-pressed");
const toSuperfloat = () => fireEvent.click(screen.getByRole("button", { name: "Superfloat" }));
const setWidth = (width) => fireEvent.change(screen.getByRole("slider", { name: /superfloat precision/i }), { target: { value: String(width) } });

test("BF16 is one sign bit, eight exponent bits and seven fraction bits", () => {
  const { container } = render(<FormatExplorer />);
  expect(fields(container)).toEqual(["sign", ...repeat("exponent", 8), ...repeat("fraction", 7)]);
  expect(container.querySelector(".format-explorer__bit--sign")).not.toBeNull();
  expect(screen.getByLabelText("BF16 16-bit layout")).toBeInTheDocument();
  expect(screen.getByText("Exponent")).toBeInTheDocument();
  expect(screen.getByText("Fraction")).toBeInTheDocument();
  expect(screen.queryByText("Scalable value field")).toBeNull();
  expect([pressed("BF16"), pressed("Superfloat")]).toEqual(["true", "false"]);
});

test("bits are numbered 15 down to 0 and show the sample pattern", () => {
  const { container } = render(<FormatExplorer />);
  const bits = [...container.querySelectorAll(".format-explorer__bit")];
  expect(bits.map((b) => b.querySelector(".bit-index").textContent)).toEqual(Array.from({ length: 16 }, (_, i) => String(15 - i)));
  expect(bits.map((b) => b.lastChild.textContent).join("")).toBe("1000010101000100");
  expect(bits[0]).toHaveAttribute("aria-label", "Bit 15: 1, sign");
  expect(bits[15]).toHaveAttribute("aria-label", "Bit 0: 0, fraction");
});

test("SFn keeps the sign and n - 1 value bits and leaves the rest unused", () => {
  const { container } = render(<FormatExplorer />);
  toSuperfloat();
  expect([pressed("BF16"), pressed("Superfloat")]).toEqual(["false", "true"]);
  expect(fields(container)).toEqual(["sign", ...repeat("sf-value", 15)]);
  expect(screen.queryByText("Unused")).toBeNull();

  setWidth(8);
  expect(fields(container)).toEqual(["sign", ...repeat("sf-value", 7), ...repeat("inactive", 8)]);
  expect(screen.getByLabelText("SF8 16-bit layout")).toBeInTheDocument();
  expect(screen.getByText("SF8 · 1 / 7")).toBeInTheDocument();
  expect(screen.getByText("Scalable value field")).toBeInTheDocument();
  expect(screen.getByText("Unused")).toBeInTheDocument();
  expect(screen.queryByText("Exponent")).toBeNull();

  setWidth(4);
  expect(fields(container)).toEqual(["sign", ...repeat("sf-value", 3), ...repeat("inactive", 12)]);
});

test("the width slider and presets only appear for Superfloat, and presets track the width", () => {
  render(<FormatExplorer />);
  expect(screen.queryByRole("slider")).toBeNull();
  toSuperfloat();
  expect(["SF4", "SF8", "SF12", "SF16"].map(pressed)).toEqual(["false", "false", "false", "true"]);
  fireEvent.click(screen.getByRole("button", { name: "SF12", exact: true }));
  expect(["SF4", "SF8", "SF12", "SF16"].map(pressed)).toEqual(["false", "false", "true", "false"]);
  expect(screen.getByRole("slider", { name: /superfloat precision/i })).toHaveValue("12");
  fireEvent.click(screen.getByRole("button", { name: "BF16" }));
  expect(screen.queryByRole("slider")).toBeNull();
});

test("storage scales with the active width against BF16's 2.00 MB", () => {
  const { container } = render(<FormatExplorer />);
  const selected = () => container.querySelector(".storage-track.selected i").style.width;
  expect(screen.getAllByText("2.00 MB")).toHaveLength(2);
  expect(screen.getByText("0%")).toBeInTheDocument();
  expect(selected()).toBe("100%");

  toSuperfloat();
  setWidth(12);
  expect(screen.getByText("1.50 MB")).toBeInTheDocument();
  expect(screen.getByText("25%")).toBeInTheDocument();
  expect(selected()).toBe("75%");
  expect(container.querySelectorAll(".storage-row span")[1]).toHaveTextContent("SF12");

  // Back to BF16 with SF12 still selected underneath: storage is BF16's again.
  fireEvent.click(screen.getByRole("button", { name: "BF16" }));
  expect(screen.getAllByText("2.00 MB")).toHaveLength(2);
  expect(screen.getByText("0%")).toBeInTheDocument();
  expect(selected()).toBe("100%");
  expect(container.querySelectorAll(".storage-row span")[1]).toHaveTextContent("BF16");
});

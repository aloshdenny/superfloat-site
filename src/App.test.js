import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FMAPipeline from "./components/FMAPipeline";
import FormatExplorer from "./components/FormatExplorer";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

test("opens the Superfloat architecture demo", async () => {
  render(<FMAPipeline />);
  await userEvent.click(screen.getByRole("button", { name: /see demo/i }));

  expect(screen.getByRole("heading", { name: /follow a multiply-accumulate/i })).toBeInTheDocument();
  expect(screen.getByRole("slider", { name: /clock frequency/i })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /fma pipeline diagram/i })).toBeInTheDocument();
});

test("supports the homepage's expanded lab and clock preset", () => {
  render(<FMAPipeline initiallyExpanded initialFrequency={8} autoPlay={false} />);
  expect(screen.queryByRole("button", { name: /see demo/i })).not.toBeInTheDocument();
  expect(screen.getByRole("slider", { name: /clock frequency/i })).toHaveValue("8");
  expect(screen.getByRole("img", { name: /fma pipeline diagram/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Play", exact: true })).toBeInTheDocument();
});

test("steps through a scalar pipeline without counting occupied stages as completed operations", () => {
  render(<FMAPipeline initiallyExpanded initialFrequency={8} autoPlay={false} />);
  for (let i = 0; i < 9; i++) fireEvent.click(screen.getByRole("button", { name: "Step +1" }));
  expect(screen.getByText("Model cycle 8")).toBeInTheDocument();
  expect(screen.getByText("200.00 M flops (sf16)")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reset" }));
  expect(screen.getByText("0 flops (sf16)")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Switch to Systolic Array view" }));
  fireEvent.click(screen.getByRole("button", { name: "Reset" }));
  expect(screen.getByText("0 flops (bf16)")).toBeInTheDocument();
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

test("keeps the demo synchronized with the default dark theme", async () => {
  document.documentElement.classList.add("dark");
  const { container } = render(<FMAPipeline />);
  await userEvent.click(screen.getByRole("button", { name: /see demo/i }));

  await waitFor(() => expect(container.querySelector(".fma-demo")).toHaveStyle({ backgroundColor: "#0b0e0c" }));

  act(() => {
    document.documentElement.classList.remove("dark");
    window.dispatchEvent(new CustomEvent("themechange", { detail: { isDark: false } }));
  });
  await waitFor(() => expect(container.querySelector(".fma-demo")).toHaveStyle({ backgroundColor: "#ffffff" }));
});

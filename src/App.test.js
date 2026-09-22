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

  await waitFor(() => expect(container.querySelector(".fma-demo")).toHaveStyle({ backgroundColor: "#09090b" }));

  act(() => {
    document.documentElement.classList.remove("dark");
    window.dispatchEvent(new CustomEvent("themechange", { detail: { isDark: false } }));
  });
  await waitFor(() => expect(container.querySelector(".fma-demo")).toHaveStyle({ backgroundColor: "#ffffff" }));
});

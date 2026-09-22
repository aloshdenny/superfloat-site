import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FMAPipeline from "./components/FMAPipeline";

test("opens the Superfloat architecture demo", async () => {
  render(<FMAPipeline />);
  await userEvent.click(screen.getByRole("button", { name: /see demo/i }));

  expect(screen.getByRole("heading", { name: /follow a multiply-accumulate/i })).toBeInTheDocument();
  expect(screen.getByRole("slider", { name: /clock frequency/i })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /fma pipeline diagram/i })).toBeInTheDocument();
});

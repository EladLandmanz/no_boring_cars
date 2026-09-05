import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoFileInput } from "@/components/sell/photo-file-input";
import { expect, test } from "vitest";

test("Add photos stays visible and Clear appears after a file is chosen", async () => {
  const user = userEvent.setup();
  const { container } = render(<PhotoFileInput name="photos" multiple />);

  expect(
    screen.getByRole("button", { name: "Add photos" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();

  const input = container.querySelector('input[type="file"]');
  expect(input).toBeTruthy();
  const file = new File(["fake"], "miata.jpg", { type: "image/jpeg" });
  await user.upload(input as HTMLInputElement, file);

  expect(screen.getByText("miata.jpg")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Clear" }));
  expect(screen.queryByText("miata.jpg")).not.toBeInTheDocument();
});

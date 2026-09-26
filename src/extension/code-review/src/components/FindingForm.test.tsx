import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FindingForm } from "./FindingForm";

afterEach(cleanup);

describe("FindingForm", () => {
  it("requires a finding, review type, and severity", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<FindingForm disabled={false} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Add finding" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Enter a finding and select its review type and severity.",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the selected review type and clears the form after success", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<FindingForm disabled={false} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByRole("textbox", { name: /finding/i }), {
      target: { value: "Verify mobile checkout" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /review type/i }), {
      target: { value: "QA" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /severity/i }), {
      target: { value: "High" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /description/i }), {
      target: { value: "Test on Android" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add finding" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        reviewType: "QA",
        task: "Verify mobile checkout",
        severity: "High",
        description: "Test on Android",
      }),
    );
    await waitFor(() => {
      const reviewType = screen.getByRole("combobox", { name: /review type/i });
      expect((reviewType as HTMLSelectElement).value).toBe("");
    });
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReviewFindingDto } from "../../../../shared/review-findings";
import { FindingsList } from "./FindingsList";

const finding: ReviewFindingDto = {
  id: "0f4f8fa8-91ce-4e46-b22c-61f5d86d10e5",
  organizationId: "org-1",
  projectId: "project-1",
  workItemId: 42,
  task: "Add a failure-path test",
  severity: "High",
  description: null,
  done: false,
  createdBy: "reviewer-1",
  createdAt: "2026-09-25T00:00:00.000Z",
  doneBy: null,
  doneAt: null,
  updatedAt: "2026-09-25T00:00:00.000Z",
  version: 1,
};

describe("FindingsList", () => {
  it("renders a read-only status for a non-Developer", () => {
    render(
      <FindingsList
        findings={[finding]}
        canResolve={false}
        pendingIds={new Set()}
        onResolve={vi.fn()}
      />,
    );
    expect(screen.getByText("Open")).toBeTruthy();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("lets the matching Developer resolve an open finding", () => {
    const onResolve = vi.fn().mockResolvedValue(undefined);
    render(
      <FindingsList
        findings={[finding]}
        canResolve
        pendingIds={new Set()}
        onResolve={onResolve}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: /add a failure-path test/i }));
    expect(onResolve).toHaveBeenCalledWith(finding.id);
  });
});

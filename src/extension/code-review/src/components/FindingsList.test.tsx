import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReviewFindingDto } from "../../../../shared/review-findings";
import { FindingsList } from "./FindingsList";

const finding: ReviewFindingDto = {
  id: "0f4f8fa8-91ce-4e46-b22c-61f5d86d10e5",
  organizationId: "org-1",
  projectId: "project-1",
  workItemId: 42,
  reviewType: "QA",
  task: "Add a failure-path test",
  severity: "High",
  description: null,
  done: false,
  resolutionAttempts: 0,
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
        onStatusChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Open")).toBeTruthy();
    expect(screen.getByText("QA Reviews")).toBeTruthy();
    expect(screen.getByText(`ID: ${finding.id}`)).toBeTruthy();
    expect(screen.getByText("0 attempts")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /close/i })).toBeNull();
  });

  it("lets the matching Developer close an open finding", () => {
    const onStatusChange = vi.fn().mockResolvedValue(undefined);
    render(
      <FindingsList
        findings={[finding]}
        canResolve
        pendingIds={new Set()}
        onStatusChange={onStatusChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /close.*failure-path test/i }));
    expect(onStatusChange).toHaveBeenCalledWith(finding.id, true);
  });

  it("lets the matching Developer reopen a closed finding without hiding its attempts", () => {
    const onStatusChange = vi.fn().mockResolvedValue(undefined);
    render(
      <FindingsList
        findings={[{ ...finding, done: true, resolutionAttempts: 2 }]}
        canResolve
        pendingIds={new Set()}
        onStatusChange={onStatusChange}
      />,
    );
    expect(screen.getByText("Closed")).toBeTruthy();
    expect(screen.getByText("2 attempts")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /reopen.*failure-path test/i }));
    expect(onStatusChange).toHaveBeenCalledWith(finding.id, false);
  });
});

import {
  REVIEW_TYPE_LABELS,
  type ReviewFindingDto,
} from "../../../../shared/review-findings";

interface FindingsListProps {
  findings: ReviewFindingDto[];
  canResolve: boolean;
  pendingIds: ReadonlySet<string>;
  onStatusChange(id: string, done: boolean): Promise<void>;
}

export function FindingsList({
  findings,
  canResolve,
  pendingIds,
  onStatusChange,
}: FindingsListProps) {
  if (findings.length === 0) {
    return <p className="empty-state">No review findings yet.</p>;
  }

  return (
    <ul className="findings-list" aria-label="Review findings">
      {findings.map((finding) => {
        const pending = pendingIds.has(finding.id);
        return (
          <li key={finding.id} className={finding.done ? "finding finding--done" : "finding"}>
            <div className="finding-badges">
              <div className="review-type">{REVIEW_TYPE_LABELS[finding.reviewType]}</div>
              <div className={`severity severity--${finding.severity.toLowerCase()}`}>
                {finding.severity}
              </div>
            </div>
            <div className="finding-content">
              <p className="finding-id">ID: {finding.id}</p>
              <h3>{finding.task}</h3>
              {finding.description ? <p>{finding.description}</p> : null}
            </div>
            <div className="finding-status">
              <span className={finding.done ? "status-pill status-pill--closed" : "status-pill"}>
                {finding.done ? "Closed" : "Open"}
              </span>
              <span className="attempt-count">
                {finding.resolutionAttempts} {finding.resolutionAttempts === 1 ? "attempt" : "attempts"}
              </span>
              {canResolve ? (
                <button
                  type="button"
                  className="status-action"
                  disabled={pending}
                  onClick={() => void onStatusChange(finding.id, !finding.done)}
                  aria-label={`${finding.done ? "Reopen" : "Close"} “${finding.task}”`}
                >
                  {pending ? "Updating…" : finding.done ? "Reopen" : "Close"}
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

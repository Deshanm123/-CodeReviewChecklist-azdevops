import type { ReviewFindingDto } from "../../../../shared/review-findings";

interface FindingsListProps {
  findings: ReviewFindingDto[];
  canResolve: boolean;
  pendingIds: ReadonlySet<string>;
  onResolve(id: string): Promise<void>;
}

export function FindingsList({ findings, canResolve, pendingIds, onResolve }: FindingsListProps) {
  if (findings.length === 0) {
    return <p className="empty-state">No review findings yet.</p>;
  }

  return (
    <ul className="findings-list" aria-label="Review findings">
      {findings.map((finding) => {
        const pending = pendingIds.has(finding.id);
        return (
          <li key={finding.id} className={finding.done ? "finding finding--done" : "finding"}>
            <div className={`severity severity--${finding.severity.toLowerCase()}`}>
              {finding.severity}
            </div>
            <div className="finding-content">
              <h3>{finding.task}</h3>
              {finding.description ? <p>{finding.description}</p> : null}
            </div>
            <div className="finding-status">
              {canResolve ? (
                <label>
                  <input
                    type="checkbox"
                    checked={finding.done}
                    disabled={finding.done || pending}
                    onChange={() => void onResolve(finding.id)}
                    aria-label={`Mark “${finding.task}” resolved`}
                  />
                  {finding.done ? "Resolved" : pending ? "Resolving…" : "Resolve"}
                </label>
              ) : (
                <span>{finding.done ? "Resolved" : "Open"}</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

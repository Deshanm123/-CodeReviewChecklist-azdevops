import { useCallback, useEffect, useMemo, useState } from "react";
import {
  compareFindingsBySeverity,
  type ReviewType,
  type ReviewFindingDto,
  type Severity,
  type WorkItemScope,
} from "../../../shared/review-findings";
import type { ReviewFindingsApiClient } from "./api-client";
import { ReviewFindingsApiError } from "./api-client";
import { FindingForm } from "./components/FindingForm";
import { FindingsList } from "./components/FindingsList";
import type { ExtensionConfig } from "./config";
import { isSameIdentity } from "./identity";
import { isReviewVisible } from "./visibility";
import type { WorkItemContext, WorkItemContextProvider } from "./work-item-context";

interface ReviewAppProps {
  api: ReviewFindingsApiClient;
  contextProvider: WorkItemContextProvider;
  config: ExtensionConfig;
}

export function ReviewApp({ api, contextProvider, config }: ReviewAppProps) {
  const [context, setContext] = useState<WorkItemContext | null>(null);
  const [findings, setFindings] = useState<ReviewFindingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const nextContext = await contextProvider.load();
      setContext(nextContext);
      if (!isReviewVisible(nextContext, config)) {
        setFindings([]);
        return;
      }
      setFindings((await api.list(scopeOf(nextContext))).sort(compareFindingsBySeverity));
    } catch (refreshError) {
      setError(errorMessage(refreshError));
    } finally {
      setLoading(false);
    }
  }, [api, config, contextProvider]);

  useEffect(() => {
    void refresh();
    return contextProvider.subscribe(() => void refresh());
  }, [contextProvider, refresh]);

  const canResolve = isSameIdentity(context?.currentUserId ?? null, context?.developerId ?? null);
  const summary = useMemo(
    () => ({ resolved: findings.filter((finding) => finding.done).length, total: findings.length }),
    [findings],
  );

  async function addFinding(input: {
    reviewType: ReviewType;
    task: string;
    severity: Severity;
    description?: string;
  }): Promise<boolean> {
    if (!context || adding) return false;
    setAdding(true);
    setError("");
    setMessage("");
    try {
      const created = await api.create(
        { ...scopeOf(context), ...input },
        crypto.randomUUID(),
      );
      setFindings((current) => [...current, created].sort(compareFindingsBySeverity));
      setMessage("Finding added.");
      return true;
    } catch (createError) {
      setError(errorMessage(createError));
      return false;
    } finally {
      setAdding(false);
    }
  }

  async function updateFindingStatus(id: string, done: boolean): Promise<void> {
    if (pendingIds.has(id)) return;
    setPendingIds((current) => new Set(current).add(id));
    setError("");
    setMessage("");
    try {
      const updated = await api.setDone(id, done);
      setFindings((current) =>
        current.map((finding) => (finding.id === updated.id ? updated : finding)),
      );
      setMessage(done ? "Finding closed." : "Finding reopened.");
    } catch (resolveError) {
      setError(errorMessage(resolveError));
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }

  if (loading) return <p role="status">Loading review findings…</p>;
  if (!context) {
    return <ErrorNotice message={error || "The work-item context could not be loaded."} />;
  }
  if (!isReviewVisible(context, config)) {
    return (
      <p className="not-applicable">
        Reviews are available for work items of type {config.supportedWorkItemType}.
      </p>
    );
  }

  return (
    <main className="code-review">
      <header className="page-header">
        <div>
          <h1>Reviews</h1>
          <p className="progress" aria-live="polite">
            {summary.resolved} of {summary.total} closed
          </p>
        </div>
        {!canResolve ? (
          <p className="read-only-note">Only the assigned Developer can close or reopen findings.</p>
        ) : null}
      </header>

      {error ? <ErrorNotice message={error} /> : null}
      <p className="success" role="status" aria-live="polite">
        {message}
      </p>

      <FindingForm disabled={adding} onSubmit={addFinding} />
      <section aria-labelledby="findings-heading">
        <h2 id="findings-heading">Findings</h2>
        <FindingsList
          findings={findings}
          canResolve={canResolve}
          pendingIds={pendingIds}
          onStatusChange={updateFindingStatus}
        />
      </section>
    </main>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="error" role="alert">
      {message}
    </div>
  );
}

function scopeOf(context: WorkItemContext): WorkItemScope {
  return {
    organizationId: context.organizationId,
    projectId: context.projectId,
    workItemId: context.workItemId,
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof ReviewFindingsApiError) {
    return error.correlationId
      ? `${error.message} Reference: ${error.correlationId}`
      : error.message;
  }
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

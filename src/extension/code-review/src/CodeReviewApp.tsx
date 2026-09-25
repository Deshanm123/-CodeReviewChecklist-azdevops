import { useCallback, useEffect, useMemo, useState } from "react";
import {
  compareFindingsBySeverity,
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
import { isCodeReviewVisible } from "./visibility";
import type { WorkItemContext, WorkItemContextProvider } from "./work-item-context";

interface CodeReviewAppProps {
  api: ReviewFindingsApiClient;
  contextProvider: WorkItemContextProvider;
  config: ExtensionConfig;
}

export function CodeReviewApp({ api, contextProvider, config }: CodeReviewAppProps) {
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
      if (!isCodeReviewVisible(nextContext, config)) {
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

  async function resolveFinding(id: string): Promise<void> {
    if (pendingIds.has(id)) return;
    setPendingIds((current) => new Set(current).add(id));
    setError("");
    setMessage("");
    try {
      const updated = await api.markDone(id);
      setFindings((current) =>
        current.map((finding) => (finding.id === updated.id ? updated : finding)),
      );
      setMessage("Finding resolved.");
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

  if (loading) return <p role="status">Loading code review findings…</p>;
  if (!context) {
    return <ErrorNotice message={error || "The work-item context could not be loaded."} />;
  }
  if (!isCodeReviewVisible(context, config)) {
    return (
      <p className="not-applicable">
        Code Review is available for {config.supportedWorkItemType} items in: {config.supportedStates.join(", ")}.
      </p>
    );
  }

  return (
    <main className="code-review">
      <header className="page-header">
        <div>
          <h1>Code Review</h1>
          <p className="progress" aria-live="polite">
            {summary.resolved} of {summary.total} resolved
          </p>
        </div>
        {!canResolve ? (
          <p className="read-only-note">Only the assigned Developer can resolve findings.</p>
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
          onResolve={resolveFinding}
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


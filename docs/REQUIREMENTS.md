# Requirements

## Status

Draft requirements for the Azure DevOps Review Checklist.

Requirements use the identifiers `FR-*` for functional requirements and `NFR-*` for non-functional requirements.

## Functional requirements

### FR-001 — Work-item integration

The product shall expose a shared Reviews experience from an Azure DevOps work item.

The MVP target is a work-item-form page/tab named **Reviews** for QA, code, and BA findings.

### FR-002 — Visibility gating by work-item type

The Reviews tab shall be visible only when the current work item's type is **Product Backlog Item**.

The tab shall not render on Task, Bug, Feature, Epic, or any other type in the MVP.

### FR-003 — State-independent visibility

The Reviews tab shall be available for a Product Backlog Item in every work-item state. The extension shall not use `System.State` as a visibility condition.

### FR-004 — Current work-item context

The extension shall obtain the current work-item ID, type, and Developer field value from the work-item form context. The user shall not be required to type the work-item ID.

### FR-005 — Current user context

The extension shall identify the signed-in user using supported Azure DevOps identity/context APIs, consistent with the identity mode already established for this Azure DevOps organization's extensions (see `DECISIONS.md`).

### FR-006 — Add a finding

Any user viewing the tab shall be able to add a finding containing:

- a short task/finding description (required, non-empty);
- a review type (required), one of `QA`, `Code`, `BA`;
- a severity (required), one of `Minor`, `Low`, `Medium`, `High`, `Critical`;
- an optional brief description (free text);
- current work-item ID and project/organization context;
- the identity of the user who added it (`createdBy`), for traceability — not shown as a gating mechanism in the MVP UI.

Adding a finding shall be repeatable: a user can add multiple findings across the life of the review, not only once.

### FR-007 — Severity is reviewer-chosen

The severity value shall be selected by the person adding the finding. The system shall not attempt to infer or auto-assign severity from the finding text.

### FR-008 — View findings

The Reviews tab shall display all findings for the current work item, ordered by severity (Critical first, Minor last), then by creation time within the same severity.

At minimum, each row shall show: stable unique ID, review type, severity, finding text, optional description (when present), open/closed state, and resolution-attempt count.

### FR-009 — Total / progress summary

The tab shall display a simple progress summary, e.g. `X of Y closed`, calculated from persisted findings for the current work item.

### FR-010 — Close or reopen a finding — developer-only

A user shall be able to close or reopen an individual finding **only if** the current signed-in user matches the work item's **Developer** field.

Users who are not the assigned Developer shall see the checklist as read-only (no interactive status actions).

Each open-to-closed transition shall increment that finding's resolution-attempt counter exactly once. Reopening shall preserve the counter and clear the current completion identity/timestamp.

### FR-011 — Authorization is server-enforced

The backend shall independently verify that the caller matches the work item's Developer field before accepting a done/not-done toggle. The frontend's read-only rendering is a UX convenience, not the authorization boundary.

To do this, the API shall resolve the work item's current Developer field via the Azure DevOps REST API (or an equivalent trusted context source) at the time of the toggle request, rather than trusting a role flag supplied by the client.

### FR-012 — Persist findings

A successful "add finding" or "toggle done" action shall persist outside the browser so it remains available after refresh, another session, or another device.

### FR-013 — Work-item scoping

Findings shall be scoped to the work item (and project/organization) they were created against. Opening a different PBI shall show only that PBI's findings.

### FR-014 — No edit/delete in MVP

The MVP shall not support editing or deleting an existing finding. Reopening is supported as described in FR-010.

### FR-015 — Loading and error states

The UI shall provide clear states for:

- loading;
- empty findings list;
- validation error (e.g. missing task text or severity);
- API failure;
- permission failure (attempting to toggle when not the Developer);
- successful add/toggle.

### FR-016 — Duplicate submission protection

The UI shall prevent accidental repeated submissions of the same finding or the same toggle while a request is in progress.

## API requirements

A minimal REST API should provide:

```text
POST   /api/review-findings
GET    /api/review-findings?workItemId={id}
PATCH  /api/review-findings/{id}/done
GET    /api/review-findings/summary?workItemId={id}
```

Exact endpoint naming may change during implementation.

### Create request example

```json
{
  "organizationId": "org-id",
  "projectId": "project-id",
  "workItemId": 48213,
  "reviewType": "Code",
  "task": "Retry loop has no max-attempt cap",
  "severity": "Critical",
  "description": "Loop can run indefinitely if the webhook endpoint never returns 2xx."
}
```

### Toggle-done request example

```json
{
  "done": true
}
```

The caller's identity for the toggle request must not be trusted from a request-body `userId`; it is derived the same way as the rest of this Azure DevOps organization's extensions (see `DECISIONS.md`).

## Data requirements

A review-finding record shall contain at least:

```text
Id
OrganizationId
ProjectId
WorkItemId
Task
Severity
Description
Done
CreatedBy
CreatedAt
DoneBy
DoneAt
UpdatedAt
```

Recommended additional fields:

```text
RowVersion / concurrency token
```

## Non-functional requirements

### NFR-001 — Security

- No secrets in frontend source or extension manifest.
- Backend endpoints require authentication consistent with this organization's established mode.
- The done/not-done toggle is authorized server-side against the work item's live Developer field, not a client-supplied flag.
- Input is validated server-side.

### NFR-002 — Privacy

Only information necessary for the checklist (finding text, severity, description, who created/resolved it, timestamps) should be stored. Avoid collecting unrelated employee profile information.

### NFR-003 — Performance

For normal usage, the Reviews tab should become usable quickly after the work-item form loads.

Initial target: findings-list API p95 under 1 second under expected pilot load.

### NFR-004 — Reliability

Findings must not disappear because a browser is refreshed or changed. API retries must not create duplicate findings.

### NFR-005 — Observability

The API shall emit structured application logs for request failures, validation failures, and authorization failures, without logging sensitive tokens/headers.

### NFR-006 — Maintainability

- TypeScript strict mode for extension and API code.
- Business rules (severity ordering, developer-match authorization) covered by tests.
- API contracts documented.

### NFR-007 — Accessibility

- Findings list and add-finding form are keyboard usable.
- Severity is never communicated by color alone (use a text/badge label).
- Checkboxes have accessible labels reflecting the finding text.

### NFR-008 — Compatibility

Implementation shall use current supported Azure DevOps Extension SDK/API patterns and the work-item-form page contribution type, consistent with existing extensions in this organization.

## Acceptance criteria for MVP

The MVP is complete when:

1. The Reviews tab is usable on a PBI in every work-item state.
2. The tab does not show the checklist UI on Task, Bug, or other work-item types.
3. A user can add a finding with task text and a severity; the finding appears in the list ordered by severity.
4. A user can add an optional brief description to a finding.
5. A user can add multiple findings across separate sessions and see all of them.
6. Only the user matching the PBI's Developer field sees interactive checkboxes; other users see a read-only list.
7. The Developer can toggle a finding done, and the progress summary updates.
8. A non-Developer attempting to toggle a finding (e.g. via a direct API call) is rejected by the API.
9. Findings persist after refresh and are correctly scoped to their own PBI.
10. Automated tests cover severity ordering, the work-item-type visibility gate, and the developer-match authorization rule.

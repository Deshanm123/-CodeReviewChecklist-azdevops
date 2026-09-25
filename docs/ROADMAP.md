# Roadmap

## Implementation status (2026-09-25)

An initial code scaffold now covers the deliverables through Phase 4: Prisma model
and migration, Fastify routes/service/repository, Azure DevOps work-item adapters,
the Reviews page contribution, accessible add/list/resolve UI, configuration,
and focused tests. It has not yet been validated against a real Azure DevOps
organization or PostgreSQL instance. Authentication ADR-007 remains proposed
because the referenced existing Time Logger identity implementation was not present
in this repository.

The roadmap is ordered to prove the smallest useful review workflow first, and to reuse existing extension/API infrastructure rather than stand up new infrastructure.

## Phase 0 — Module scaffolding

**Goal:** add the new module to the existing repository without breaking the existing Time Logs feature.

Deliverables:

- `review-findings` Prisma model and migration;
- `review-findings` API module (routes/service/repository) inside the existing Fastify app;
- `Reviews` work-item-form page contribution added to the existing extension manifest;
- unit-test scaffolding for the new module.

Exit criteria:

- extension still builds with both tabs present;
- API still builds and existing Time Logs tests still pass;
- new migration applies cleanly against the existing database.

## Phase 1 — Visibility gate and read-only shell

**Goal:** prove the tab shows up only where it should, before any write behavior exists.

Deliverables:

- read work-item type, Developer field, and current user from form context;
- client-side gate based only on PBI work-item type;
- empty-state UI when there are no findings yet;
- loading/error states.

Exit criteria:

- opening a PBI in any state shows the Reviews UI;
- opening a non-PBI work item does not show the checklist UI;
- the gate re-evaluates on a live work-item-type change where the SDK supports it.

## Phase 2 — Add and view findings

**Goal:** deliver the first useful end-to-end workflow: reviewers can leave findings.

Deliverables:

- create API (`POST /api/review-findings`);
- list-by-work-item API (`GET /api/review-findings`);
- add-finding form: task, severity, optional description;
- findings list, ordered by severity;
- duplicate-submit protection.

Exit criteria:

- a reviewer can add a finding and see it appear, correctly sorted;
- refreshing the work item still shows previously added findings;
- findings for one PBI are not visible on another PBI.

## Phase 3 — Developer-only resolution

**Goal:** make the checklist actionable for the assigned developer, safely.

Deliverables:

- summary API (`GET /api/review-findings/summary`);
- toggle-done API (`PATCH /api/review-findings/{id}/done`) with server-side Developer-field resolution and authorization;
- interactive checkbox rendering only for the matching Developer, read-only for everyone else;
- progress summary (`X of Y resolved`);
- API authorization tests, including a rejected toggle from a non-Developer.

Exit criteria:

- the Developer can tick a finding done and see progress update;
- a non-Developer's toggle attempt (including a direct API call) is rejected by the server;
- the read-only view is correct for all other viewers.

## Phase 4 — UX hardening

**Goal:** make the tab usable by a pilot team without developer intervention.

Deliverables:

- accessibility pass (keyboard use, labels, no color-only severity signaling);
- configurable work-item type and Developer field reference name;
- clear permission-denied messaging;
- responsive layout;
- telemetry/correlation IDs consistent with the existing API.

Exit criteria:

- pilot team can add and resolve findings on real PBIs without developer intervention for normal flows.

## Phase 5 — Edit, delete, reopen

**Goal:** remove the "append-only" limitation once the core workflow is proven.

Possible deliverables:

- edit a finding's task/severity/description (own findings, or reviewer role once one exists);
- delete a finding;
- reopen a resolved finding;
- concurrency handling for simultaneous edits.

## Phase 6 — Process integration

**Goal:** connect the checklist to how the team actually gates PBI progress.

Possible deliverables:

- surface unresolved Critical/High counts on the work item summary;
- optional category-specific workflows if QA, code, and BA reviews later need different ownership or completion rules;
- notification when a new Critical/High finding is added, or when all findings are resolved.

## Phase 7 — Reporting

**Goal:** make finding data useful beyond a single PBI.

Possible deliverables:

- export/ingestion contract consistent with the existing analytics approach;
- reporting on finding volume/severity by reviewer, developer, project, or time period;
- trend reporting (are Critical findings decreasing over time).

## Suggested MVP cut

For a pilot, stop after **Phase 4**.

That gives:

```text
PBI in any state
        ↓
Reviews tab (QA + Code + BA)
        ↓
Reviewer adds findings with severity (repeatable)
        ↓
Developer-only checklist resolution
        ↓
Persistent, correctly-scoped, correctly-authorized checklist
```

Everything after that can be justified from actual pilot feedback.

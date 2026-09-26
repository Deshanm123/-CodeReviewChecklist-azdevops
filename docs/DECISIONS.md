# Decisions

This file records important product and architecture decisions for the Code Review Checklist.

Use the format:

```text
ADR-XXX — Decision title
Status
Context
Decision
Consequences
```

Do not silently change an accepted decision in code. Update this file and explain the reason.

---

## ADR-001 — Extend the existing extension/API instead of building a new stack

**Status:** Superseded by ADR-009

### Context

This organization already has a working Azure DevOps extension (React + TypeScript), a Fastify + Prisma + PostgreSQL API deployed on Vercel, and an established identity mode (see the Time Logger's `DECISIONS.md`). The Code Review Checklist is a similarly-shaped feature: a work-item-form tab backed by a small REST API and a database table.

### Decision

Add a new `Code Review` work-item-form tab to the existing extension package, and a new `review-findings` module to the existing Fastify API and Prisma schema, rather than standing up a second extension package or a second deployed service.

### Consequences

- No duplicate manifest, publisher setup, CI pipeline, or deployment to operate.
- The feature inherits the existing identity/authentication mode as-is; it does not need to solve authentication again.
- The existing extension package grows in scope (two tabs instead of one), so releases of one feature can affect the packaging of the other; this must be handled with care in CI/versioning.
- If the two features later need to diverge significantly (different release cadence, different manifest scopes), splitting them into separate packages can be revisited.

---

## ADR-002 — Findings are dynamic and independently resolvable in the MVP

**Status:** Accepted

### Context

Reviewers work through a PBI's implementation iteratively and find issues over time, not all at once. Supporting edit/delete/reopen adds meaningful complexity (concurrent edits, audit trail, what happens to a "done" finding that gets edited) that is not required to prove the core workflow.

### Decision

The MVP supports: add a finding, view all findings, and close or reopen each finding independently. Editing and deleting remain out of scope for the MVP. Resolution attempts are retained and increment only when a finding moves from open to closed.

### Consequences

- Reviewers can keep adding findings throughout the review without friction.
- A mistaken finding cannot be removed or corrected in the MVP; a follow-up finding or an out-of-band correction (e.g. a comment) is the workaround until edit/delete ships.
- Reopening preserves the resolution-attempt count so repeated review cycles remain visible.

---

## ADR-003 — Severity is a fixed five-value enum chosen by the reviewer

**Status:** Accepted

### Context

The requirement is for the reviewer to pick severity "depending on context" (e.g. a typo is usually Minor, a system-breaking defect is usually Critical). This is inherently a judgment call, not something the system can reliably infer from text.

### Decision

Provide a fixed severity scale — `Minor`, `Low`, `Medium`, `High`, `Critical` — as a required field on every finding, selected by the person adding it. The system does not attempt automatic severity classification.

### Consequences

- Simple, predictable UI (a single required picker).
- Consistency of meaning across reviewers depends on team convention, not system enforcement; this may need a short team guideline (not a code change) if severities are used inconsistently.
- Making the scale configurable per organization/project is deferred; see Roadmap.

---

## ADR-004 — Visibility gate (PBI type + In Progress / Code Review Pending state) is enforced client-side, re-checked implicitly by scoping

**Status:** Superseded by ADR-008

### Context

The requirement is to show the Code Review tab only for Product Backlog Items in the `In Progress` or `Code Review Pending` states. Azure DevOps work-item-form page contributions do not offer a fully declarative, guaranteed-server-side way to hide a tab based on a field value across all supported deployment/process-template combinations.

### Decision

The extension reads work-item type and state from the form context on load (and on field change, where the SDK exposes it) and renders nothing (or a minimal placeholder) unless type is PBI and state is in the configured allow-list. The API does not separately re-enforce this gate, because it is a UI-visibility concern, not a security boundary — anyone who can already open the PBI can already see it regardless of this extension.

### Consequences

- The gate can theoretically show stale UI for a moment if the state changes and the SDK does not emit a field-changed event in a given Azure DevOps host version; this is a cosmetic risk, not a data-integrity one.
- The allow-listed states are configuration, not a hard-coded constant, because process templates can rename or add states (see `ARCHITECTURE.md` Configuration section).
- This decision does not affect the separate, security-relevant authorization rule for toggling a finding (see ADR-005), which is enforced server-side regardless of tab visibility.

---

## ADR-008 — Reviews are available regardless of work-item state

**Status:** Accepted

### Context

The tab now covers QA, code, and BA review findings in one place. Those activities
can occur throughout a PBI's lifecycle, so limiting the UI to `In Progress` and
`Code Review Pending` no longer matches the broader workflow.

### Decision

Keep the Product Backlog Item type gate, but remove all work-item state checks and
state configuration. The shared `Reviews` tab is available on a PBI in every state.

### Consequences

- QA, code, and BA findings share the existing severity-ranked list.
- Changing a PBI's state no longer affects the tab's content visibility.
- Every finding now persists one of the three review types defined by ADR-009.

---

## ADR-005 — The done/not-done toggle is authorized against the work item's live Developer field, resolved server-side

**Status:** Accepted

### Context

The requirement is that only the user who is the PBI's Developer can tick a finding as done. A client-side check (render checkbox only if `currentUser == developerField`) is necessary for UX but is not sufficient for security, consistent with this organization's existing rule that the frontend is never trusted for authorization (see the Time Logger's `DECISIONS.md` ADR-009).

### Decision

On every toggle request, the API resolves the work item's current Developer field via the Azure DevOps REST API and compares it to the authenticated caller's identity. The toggle is rejected if they do not match. The client-supplied "I am the developer" assumption from the UI is never trusted directly.

### Consequences

- An extra Azure DevOps REST call is made per toggle request; this is accepted for MVP correctness and can be optimized with a short-lived cache later if latency becomes a measured problem.
- The Developer field is read live, so if the Developer field changes between page load and the toggle action, the newly resolved Developer is the one authorized — the API does not authorize based on a stale value captured at page load.
- Adding a finding is intentionally not gated by a "reviewer" role/permission in the MVP, because Azure DevOps does not expose a first-class "reviewer" concept to check against; any user who can view the PBI can add a finding. This is an accepted MVP simplification (see `PRODUCT.md`).

---

## ADR-006 — Findings persist server-side, not in browser storage

**Status:** Accepted

### Context

Local storage would make findings device/browser specific and unsuitable for a shared checklist that both the reviewer and developer, on different machines, need to see consistently.

### Decision

Persist review findings in the existing PostgreSQL database via the existing Prisma layer, following the same pattern as time logs.

### Consequences

- Findings survive refresh/device changes and are visible to any authorized viewer of the PBI.
- The feature depends on the existing API's availability.

---

## ADR-007 — Validate extension bearer tokens through Azure DevOps

**Status:** Proposed — requires owner review before production deployment

### Context

The specification refers to an identity mode inherited from a Time Logger module,
but that module and its authentication implementation are not present in this
repository. The API still needs a trusted caller identity and must not accept a
client-supplied user ID.

### Proposed decision

Accept the access token returned by the supported Azure DevOps Extension SDK in an
`Authorization: Bearer` header. The API verifies it against the configured Azure
DevOps organization's `connectionData` endpoint and uses the returned stable
identity ID as the caller. The same bearer token is used to confirm work-item read
access and resolve the configured Developer identity field at toggle time.

The organization URL and ID are server configuration. The Developer field must
return an identity object with a stable ID; the API fails closed instead of falling
back to display-name or email matching.

### Consequences

- The backend never trusts a request-body user ID or an unsigned identity header.
- Each request performs Azure DevOps verification; toggle requests also read the
  live work item, favoring correctness over caching in the MVP.
- Expired tokens and Azure DevOps outages fail closed.
- The approach must be replaced or this ADR accepted if the absent Time Logger
  authentication implementation is later supplied and uses a different mode.

---

## ADR-009 — Findings carry a review type, stable ID, reopenable status, and attempt counter

**Status:** Accepted

### Context

The Reviews tab now owns QA, code, and BA review workflows. A finding needs an explicit category and a stable reference, and repeated close/reopen cycles must remain visible rather than losing their history.

### Decision

Every finding has a required fixed review type (`QA`, `Code`, or `BA`) and a backend-generated UUID displayed in the UI. The assigned Developer may close or reopen each finding independently. Every open-to-closed transition atomically increments `ResolutionAttempts`; reopening preserves the counter and clears `DoneBy`/`DoneAt`. Finding content remains immutable after creation, and edit/delete remain out of scope.

### Consequences

- Existing rows are migrated to `Code`; already-closed rows start with one attempt.
- Attempts measure completed resolution cycles, not button clicks or reopen actions.
- Status changes retain optimistic-concurrency protection and live Developer authorization.

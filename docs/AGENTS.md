# AGENTS.md

Instructions for Codex and other coding agents working on the Review Checklist feature.

These instructions apply to the `review-findings` module and the `Reviews` extension tab. If a more specific `AGENTS.md` exists in a subdirectory, that one wins for that subtree. For anything not covered here, the repository's root `AGENTS.md` (for the Time Logger and shared repo conventions) still applies.

## 1. Read before coding

Before making changes:

1. Inspect the repository structure, including the existing `time-logs` module as a reference pattern.
2. Read:
   - `PRODUCT.md`
   - `REQUIREMENTS.md`
   - `ARCHITECTURE.md`
   - `DECISIONS.md`
   - `ROADMAP.md`
3. Inspect the existing extension manifest, existing work-item-form page contribution, existing Fastify module structure, Prisma schema, and existing tests.
4. Do not assume the repository already matches everything described in these docs — verify against the actual code first.
5. Prefer existing project conventions (from the Time Logger module) when they do not conflict with an explicit requirement or accepted decision here.

Do not create a parallel extension package or a parallel API deployment because it is easier than integrating with the existing one — ADR-001 in `DECISIONS.md` explicitly rejects that.

## 2. Product objective

The core domain is:

```text
Work Item (PBI)
  + Finding (task, severity, optional description)
  + Done state
  + Developer field match
  = Review Finding
```

The feature must preserve the append-only MVP shape: add and view findings, and let only the matching Developer toggle done. Do not add edit/delete/reopen unless a task explicitly requires it (see ROADMAP Phase 5).

## 3. Current MVP boundary

Focus on:

- shared `Reviews` work-item-form tab for QA, code, and BA findings, gated only to PBI type and available in every state;
- add finding (task, severity, optional description);
- view findings, ordered by severity;
- developer-only done toggle, authorized server-side;
- progress summary;
- tests.

Do not introduce these unless the task explicitly requires them:

- edit/delete/reopen of a finding;
- a distinct "reviewer" role/permission model;
- notifications;
- cross-PBI reporting;
- configurable severity scale;
- blocking/gating PBI state transitions.

## 4. Repository inspection rule

For every non-trivial task, first inspect the relevant files.

Examples:

- extension change -> inspect manifest, `src/extension` structure, the existing Time Logs tab component for conventions, SDK wrapper, existing components/tests;
- API change -> inspect the existing `time-logs` module, Fastify bootstrap/routes, Prisma schema/migrations, and tests before adding to `review-findings`;
- schema change -> inspect current migrations and production compatibility with the existing `TimeLogs` table;
- manifest/scope change -> inspect the currently requested scopes before adding new ones.

Never overwrite an existing file (including the existing Time Logs tab or module) based only on documentation examples in this feature's docs.

## 5. Azure DevOps extension rules

Use the current supported Azure DevOps Extension SDK/API packages already present in the repository. Do not introduce deprecated VSS SDK patterns.

Keep Azure DevOps-specific calls behind the same small adapters/services pattern already used by the Time Logs tab, so the Code Review UI can be tested without a live Azure DevOps organization.

Do not:

- hard-code organization URLs, project IDs, or work-item IDs;
- hard-code the Developer field reference name — read it from configuration (`ARCHITECTURE.md` Configuration section);
- embed PATs or client secrets;
- log access tokens.

The visibility gate (type == PBI) is client-side UI logic (ADR-008) — implement it defensively, do not add a work-item state condition, and do not treat it as a security boundary. The done-toggle authorization is a security boundary and must be re-verified server-side (ADR-005) regardless of what the client renders.

## 6. Backend rules

The `review-findings` module is added to the existing Node.js + TypeScript + Fastify API. Use TypeScript strict mode. Keep route handlers thin; put severity ordering, validation, and the Developer-match authorization check in testable service functions.

The API is the authority for:

- finding validation (task required, severity enum);
- severity ordering and summary calculation;
- the done-toggle authorization decision.

Do not trust a client-supplied "I am the Developer" flag, role, or `userId` for the toggle. Resolve the work item's Developer field via the Azure DevOps REST API at request time and compare it to the authenticated caller's identity (ADR-005). If the Azure DevOps REST call fails, fail the toggle closed (reject it) rather than defaulting to allow.

## 7. Data rules

A review finding is an append-only record in the MVP: `Task`, `Severity`, and `Description` are set once at creation and are not mutated by later requests. Only `Done`, `DoneBy`, `DoneAt`, and `UpdatedAt` change after creation, via the toggle endpoint.

Use Prisma migrations for schema changes. Do not delete or rewrite migration history, including the existing `TimeLogs` migrations, without an explicit reason and user approval.

## 8. Security rules

Never commit passwords, PATs, database passwords, connection strings with secrets, client secrets, or private keys. Use the repository's established secret mechanism (same as the Time Logger module — do not introduce a second one).

Avoid logging sensitive request headers, tokens, or the raw Developer-field resolution response beyond what is needed for a correlation-ID-tagged error.

If the Developer field reference name or the identity-matching rule is unclear for a given process template, stop and identify the missing decision instead of inventing a matching heuristic (e.g. matching on display name instead of a stable identifier).

## 9. Minimal-diff rule

Prefer the smallest coherent change that satisfies the requirement. Avoid unrelated formatting churn, renaming, dependency upgrades, or changes to the existing Time Logs module while working on Review Checklist tasks. If unrelated issues are discovered in the existing module, report them separately rather than fixing them inline.

## 10. Testing rule

For implementation changes:

1. add or update tests;
2. run the smallest relevant test set first (the `review-findings` module);
3. run the broader suite when practical, including existing Time Logs tests, to confirm no regression;
4. report exactly what was run and whether it passed.

Do not claim tests passed unless they were actually executed.

Core rules that should have automated coverage include:

- task required / non-empty;
- severity must be one of the five allowed values;
- severity ordering in the returned list and UI;
- visibility gate: every PBI state shows the Reviews UI; non-PBI types do not;
- done toggle succeeds when caller matches the resolved Developer field;
- done toggle is rejected when caller does not match, including when the client believed it did;
- toggle fails closed if the Developer-field resolution call errors.

## 11. Documentation rule

Documentation is part of the product. Update the relevant file when implementation changes:

- product scope -> `PRODUCT.md`
- requirement/acceptance behavior -> `REQUIREMENTS.md`
- architecture/data flow -> `ARCHITECTURE.md`
- important technical/product choice -> `DECISIONS.md`
- delivery order/status -> `ROADMAP.md`
- agent behavior for this feature -> this file

Do not silently make architecture decisions (e.g. adding edit/delete, changing the authorization approach) only in code.

## 12. Decision rule

If a requested change conflicts with an accepted ADR in `DECISIONS.md` (for example, moving the visibility gate server-side, or trusting a client-supplied Developer flag):

1. identify the conflict;
2. propose the ADR change;
3. explain consequences;
4. wait for confirmation before treating the design as final.

Small implementation details do not require a new ADR.

## 13. User review rule

For substantial changes to the authorization model, the data model, the visibility gate, or manifest scopes, present the proposed approach, identify affected files, call out assumptions, and get user confirmation before treating the design as final.

For straightforward implementation inside already-accepted decisions, proceed and report it for review.

## 14. No fake integrations

Do not claim the Azure DevOps REST API, the database, or the Developer-field resolution is integrated and working unless it has actually been implemented and tested. Mocks must be clearly identified as mocks.

## 15. Error handling

Use user-friendly messages in the extension (e.g. "Only the assigned Developer can resolve findings") and structured errors in the API. Do not expose raw stack traces to users. Include correlation/request IDs consistent with the existing API's error model.

## 16. Accessibility

New UI must be keyboard usable. Use semantic elements, explicit labels, and accessible validation text. Severity must never be communicated by color alone — pair color with a text label.

## 17. Performance

Avoid unnecessary Azure DevOps REST calls. The Developer-field resolution on toggle is an accepted per-request cost for MVP; do not add caching for it until there is a measured need (see `ARCHITECTURE.md`).

## 18. Completion format

When finishing a task, report:

1. what changed;
2. files changed;
3. important design choices;
4. tests run and results;
5. any assumptions or unresolved issues;
6. documentation updated.

Keep the report concise and factual.

## 19. Definition of done for agent changes

A change is not done merely because code compiles. For applicable changes, verify:

- requirement is satisfied;
- the visibility gate depends on work-item type and not work-item state;
- the done-toggle authorization is enforced server-side, not just hidden client-side;
- error path is handled;
- tests exist/pass;
- no secrets are introduced;
- documentation is consistent;
- no unrelated changes were added, including to the existing Time Logs module.

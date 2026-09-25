# Azure DevOps Code Review Checklist

## Objective

Let a reviewer leave a dynamic, severity-ranked checklist of findings on a Product Backlog Item (PBI) while it's in review, and let the assigned Developer resolve those findings from the same work item — without a separate review tool, spreadsheet, or comment thread.

## Goals

- Reviewers can add findings (task + severity + optional description) at any point during review, not just once.
- Severity (`Minor`, `Low`, `Medium`, `High`, `Critical`) is a judgment call the reviewer makes based on context — the system does not infer it.
- The checklist only appears where it's relevant: work-item type **Product Backlog Item**, state **In Progress** or **Code Review Pending**.
- Only the user recorded in the PBI's **Developer** field can tick findings as done — enforced by the API, not just hidden in the UI.
- Reuse the organization's existing Azure DevOps extension and API rather than standing up new infrastructure.

## Non-goals (MVP)

- Editing, deleting, or reopening a finding.
- A distinct "reviewer" permission/role.
- Linking findings to Pull Request diffs.
- Notifications, blocking state transitions, or cross-PBI reporting.

See [`docs/PRODUCT.md`](docs/PRODUCT.md) for the full product rationale and
[`docs/ROADMAP.md`](docs/ROADMAP.md) for what's deferred to later phases.

## Where to look

| File | What it answers |
| --- | --- |
| `docs/PRODUCT.md` | What product are we building and why? |
| `docs/REQUIREMENTS.md` | What must it do? |
| `docs/ARCHITECTURE.md` | How is the system structured? |
| `docs/DECISIONS.md` | What important choices have we made and why? |
| `docs/ROADMAP.md` | What are we building, in what order? |
| `docs/AGENTS.md` | How should Codex/coding agents behave while working on this? |

## Relationship to the existing Time Logger extension

This feature is delivered as an additional tab (`Code Review`) inside the same Azure DevOps extension package as the existing Time Logs feature, and as a new module (`review-findings`) inside the existing Fastify + Prisma + PostgreSQL API — not a new extension package or a new deployment. See `DECISIONS.md` (ADR-001) for why.

## Repository layout

```text
api/                                  Vercel function entry point
prisma/                               schema and ReviewFindings migration
src/api/                              Fastify API
src/api/modules/review-findings/      domain module
src/extension/code-review/            Azure DevOps React contribution
src/shared/                           shared API contracts and ordering rules
docs/                                 product and engineering specifications
```

## Getting started (development)

This feature is developed inside the existing repository alongside the Time Logger:

1. Read [`docs/AGENTS.md`](docs/AGENTS.md) before making a change.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and set the organization URL/ID and the
   process-specific Developer field reference name. Keep real secrets out of source control.
4. Start PostgreSQL, set `DATABASE_URL`, then run `npm run prisma:generate` and
   `npm run prisma:migrate`.
5. Run the API with `npm run dev:api` and the extension build server with
   `npm run dev:extension`.
6. Run `npm test`, `npm run typecheck`, and `npm run build` before packaging.

For backend deployment, follow [`docs/VERCEL.md`](docs/VERCEL.md). The backend is a
single Vercel Fastify Function; the extension remains a separately packaged VSIX.

The extension manifest contains a placeholder publisher. Replace
`replace-with-your-publisher` in `vss-extension.json` before packaging it with the
Azure DevOps extension tooling.

## Security configuration

The generated API uses the extension's Azure DevOps bearer token to resolve the
authenticated identity through Azure DevOps and to read the live work item. The
Developer field must return an identity object containing a stable Azure DevOps
identity ID; display-name matching is deliberately rejected. See proposed ADR-007
in [`docs/DECISIONS.md`](docs/DECISIONS.md) before production use.

## Status

An implementation scaffold for MVP Phases 0–4 is present. It includes the database
model, REST endpoints, live Developer authorization adapter, work-item page UI, and
automated unit/component tests. A real Azure DevOps organization and PostgreSQL
database are still required for integration validation and extension packaging.

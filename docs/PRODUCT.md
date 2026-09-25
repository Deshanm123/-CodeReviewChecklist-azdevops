# Product

## Product name

**Azure DevOps Review Checklist**
Working name only; branding can change later.

## Product statement

Build an Azure DevOps extension that lets QA, code, and BA reviewers leave a **dynamic, severity-ranked checklist** of review findings directly on a Product Backlog Item (PBI), and lets the assigned **Developer** resolve those findings from inside the same work item — without separate review tools, spreadsheets, or comment threads.

## Problem

Azure DevOps has comments and Pull Request review threads, but:

- PR comments are tied to a diff, not to the work item the team actually plans and tracks against;
- there is no structured, checkable "review findings" list with severity;
- there is no lightweight way for a reviewer to say "this is a typo (minor)" vs "this breaks the build (critical)" and have the developer track resolution against the PBI itself;
- reviewers currently use comments, chat, or verbal handoff, which is not structured, not filterable, and does not clearly show what is still outstanding.

## Product goal

Make leaving and resolving review findings a natural part of working a PBI: a reviewer opens the PBI, adds findings with a severity as they review, and the developer sees one checklist to work through and tick off.

## Primary users

### Reviewers

QA engineers, developers, tech leads, and business analysts who review a PBI and want to leave structured, severity-ranked findings.

### Developers

The person recorded in the PBI's **Developer** field. They see the checklist when they are the logged-in user and mark items done as they address them.

### Delivery leads

Scrum Masters / Tech Leads who want visibility into whether a PBI has outstanding review findings, and how severe they are, before it is considered done.

## Primary user story

> As a reviewer, I want to add review findings to a PBI as I review it, each with a severity I choose based on context, so the developer has a clear, ranked list of what to fix.

## Supporting user stories

> As a reviewer, I want to add an optional short description to a finding so the developer understands what I mean without a follow-up conversation.

> As the developer assigned to the PBI, I want to see the checklist of findings and tick each one off as I resolve it, so my progress is visible without repeating status updates.

> As a reviewer, I want to keep adding findings to the list at any point during review (not just once), because review is iterative and I find things as I go.

> As a delivery lead, I want one review checklist on every PBI regardless of state, so QA, code, and BA findings remain visible throughout delivery.

## MVP experience

The extension contributes a **Reviews** tab/section on Product Backlog Item forms. It is available in every PBI state and combines QA, code, and BA findings in one list.

The tab contains:

1. A dynamic, append-only list of review findings. Each finding has:
   - a short task/finding description (required);
   - a severity: `Minor`, `Low`, `Medium`, `High`, `Critical` (required, chosen by the reviewer based on context — e.g. a typo is typically Minor, a system-breaking defect is typically Critical);
   - an optional brief description/detail;
   - a done/not-done state.
2. An **Add finding** action, usable repeatedly, so reviewers can add items throughout the review rather than in one batch.
3. A checklist view, ordered with the most severe findings first, where each item can be ticked done.
4. A simple progress indicator (e.g. `3 of 7 resolved`).

### Who can do what

- **Any team member who can open the PBI** can view the checklist (read-only) so reviewers, developers, and leads all see the same state.
- **Adding a finding** (task + severity + optional description) is available to any user viewing the tab in the MVP; there is no separate "reviewer" role/permission in Azure DevOps to gate on. See ADR on reviewer identity.
- **Ticking an item done** is restricted to the user who is the **current, logged-in user matching the PBI's Developer field**. Only that person sees the checkboxes as interactive; everyone else sees the list read-only.

## Example

```text
PBI #48213 — Add retry logic to webhook dispatcher
State: Any
Developer: Nadeesha K.

Reviews

[+] Add finding

Severity   Finding                                   Done
--------   ---------------------------------------   ----
Critical   Retry loop has no max-attempt cap            [ ]
High       Webhook secret logged in plaintext            [ ]
Medium     Missing unit test for failure path             [ ]
Minor      Typo in error message ("recieved")            [x]

Progress: 1 of 4 resolved
```

## Value

The product creates a clean relationship between:

```text
Azure DevOps PBI in review
        +
Structured, severity-ranked findings
        =
A clear, trackable definition of "review done"
```

It can later support questions such as:

- How many Critical/High findings does a PBI have before it can move past review?
- How long do findings of a given severity take to resolve?
- Which reviewers or developers have the most recurring finding types?

## Product principles

### The checklist is lightweight, not a full review workflow

This is not a replacement for Pull Request review. It is a structured summary of what still needs fixing, visible on the work item itself.

### Severity is a judgment call, not a fixed rule

The reviewer picks severity based on context (a typo in a comment vs. a typo in a user-facing string are not the same). The system provides a fixed severity scale; it does not attempt to auto-classify severity.

### Visibility is gated only by work-item type

The checklist UI is available for PBIs in every state and remains excluded from other work-item types.

### Resolution is the developer's action, not the reviewer's

Only the assigned Developer marks items done. A reviewer cannot tick their own findings as resolved on the developer's behalf in the MVP.

## MVP scope

Included:

- Shared Reviews tab for QA, code, and BA findings, gated only by work-item type = PBI.
- Add a finding (task, severity, optional description).
- Dynamic/repeated adding of findings during review.
- View findings list, ordered by severity.
- Mark a finding done, restricted to the user matching the Developer field.
- Persistent backend storage per PBI.
- Progress summary (done vs. total).

Not included in MVP:

- Editing or deleting an existing finding.
- Reviewer-specific permissions/roles beyond "any viewer can add."
- Linking findings to specific Pull Request lines/diffs.
- Notifications when a finding is added or resolved.
- Reopening a resolved finding.
- Reporting/analytics across PBIs.
- Configurable severity scale per organization.

## Future product areas

- Edit/delete/reopen a finding.
- Comment thread per finding.
- Notify the developer when a new Critical/High finding is added.
- Block/flag the PBI state transition while unresolved Critical findings remain.
- Cross-PBI reporting on finding volume and severity by reviewer/developer/team.
- Configurable severity labels and finding categories per organization.

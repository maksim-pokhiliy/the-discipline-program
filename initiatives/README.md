# Initiatives — how big features are run here

A big feature spans many sessions. Without a durable home, each new session re-derives context and drifts. An **initiative** is that home: a small, fixed set of files per big feature, plus a resume protocol, so work survives across sessions.

This **replaces the two-session planner/executor workflow** (`implementation/WORKFLOW.md`, now superseded). One session does both halves: plan the step, run the code through `/feature` (or an ultracode workflow), validate, update state. The `/feature` pipeline stays the quality gate — the single-session model drops the _shuttle ceremony_, not the quality bar.

## An initiative

`initiatives/<slug>/` holds exactly:

- `charter.md` — goal · scope · non-goals · acceptance criteria · driving ADR(s). Set once, refined rarely.
- `plan.md` — the phased steps with statuses. The live roadmap of the initiative.
- `state.md` — **one** live file: where we are · next action · open decisions · deferred. **Updated every session.** The resume entry point.
- `journal.md` — append-only: per step, what shipped (commits, what the `/feature` run did, notes).
- plus any design docs the initiative needs (e.g. `algebra-spec.md`).

No per-step `prompt.md`/`output.md` directories — that was the shuttle. Detailed `/feature` artifacts live in gitignored `.feature-dev/`; the journal keeps the durable summary.

## Resume protocol (the anti-context-loss mechanism)

**Resume:** read `charter.md` (what & why) → `state.md` (where we are + next action) → `plan.md` (the step). The active initiative is pinned in memory so a fresh session knows which one is live.

**Close a session:** update `state.md` (move the cursor, record decisions/deferrals) → append `journal.md` → update the step's status in `plan.md`. One docs commit.

## Decisions vs working state

- **Durable architecture decisions → ADRs** (`docs/adr/`, per ADR-0001). An initiative's key calls get an ADR; the charter links it.
- **Working state → here.** `initiatives/` is top-level and **readable** (NOT under `.claudeignore`'d `docs/`), so a resuming session actually loads it.

## Where things live (doc-map)

| Home                                                    | Holds                                                                                         |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `docs/adr/`                                             | durable architecture decisions (WHY)                                                          |
| `docs/` (roadmap, runbooks, personas, bounded-contexts) | curated project docs                                                                          |
| `initiatives/<slug>/`                                   | active big-feature hubs — charter/plan/state/journal/design = WHERE WE ARE                    |
| `analysis/`                                             | training-domain reference corpus (`source/` sacred) + pre-pivot derivation (history/evidence) |
| `implementation/`                                       | training-domain pre-pivot execution log (history; superseded by this system)                  |
| memory                                                  | cross-session pointers (active initiative, durable feedback)                                  |

## Starting a new initiative

Copy `_template/` to `initiatives/<slug>/`, fill `charter.md`, seed `plan.md`, point memory at its `state.md`.

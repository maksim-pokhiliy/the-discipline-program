# Initiatives — how big features are run here

A big feature spans many sessions. Without a durable home, each new session re-derives context and drifts. An **initiative** is that home: a fixed set of files per big feature + a resume protocol + a **promotion discipline**, so work — and the _reasoning behind it_ — survives across sessions.

This **replaces the two-session planner/executor workflow** (`implementation/`, now superseded history). One session does both halves: plan the step, run the code through `/feature` (or an ultracode workflow), validate, close out. The `/feature` pipeline stays the quality gate — the single-session model drops the _shuttle ceremony_, not the quality bar, and (since 2026-06-03) **not the structured board either**.

## An initiative

`initiatives/<slug>/` holds:

- `charter.md` — goal · scope · non-goals · acceptance criteria · driving ADR(s). Set once, refined rarely.
- `plan.md` — the phased roadmap: steps/sub-steps with status. The "what & sequence."
- `state.md` — **the board**: a scannable status table + the ONE concrete next-action handoff + pointers to open decisions/deferred. The resume entry point. **Updated every session.**
- `decisions.md` — D-numbered ratified decisions: one-liner + rationale + status (`RATIFIED`/`OPEN`/`SUPERSEDED`). Step-level calls that don't merit a full ADR. **The SSOT for "why."**
- `deferred.md` — carry-forwards: finding + disposition + status (`OPEN`/`SCHEDULED`/`CLOSED`/`DROPPED`). Where WARNINGs and follow-ups live so they don't get lost.
- `journal.md` — append-only narrative: per session, what shipped (commits, what the `/feature`/workflow run did).
- plus design docs the initiative needs (e.g. `algebra-spec.md`, a recon doc).

No per-step `prompt.md`/`output.md` dirs — that was the shuttle. Detailed `/feature` artifacts live in gitignored `.feature-dev/`; **the durable distillate is promoted into the initiative** (below).

## Resume protocol (anti-context-loss)

The active initiative is pinned in `initiatives/ACTIVE` (one line: the slug) and a **SessionStart hook force-loads its `state.md` into context** every session, so a fresh session opens with the board already loaded.

Read in order: `charter.md` (what & why) → `state.md` (board + next action) → `decisions.md` **open** entries + `deferred.md` **open** entries → `plan.md` (the step) → the relevant design docs. Trust the promoted distillate (`decisions.md`/`deferred.md`/recon docs) over re-deriving from code or chat.

## Close-out protocol (run `/initiative-close`)

At the end of any session that touched the initiative:

1. **Promote** (the load-bearing fix): every decision ratified this session → `decisions.md` (with rationale); every new carry-forward → `deferred.md` (with disposition); anything that lived only in gitignored `.feature-dev/` or an external chat → promoted to durable initiative docs. **Nothing load-bearing stays only in scratch or an external tool.**
2. **Update the board** — `state.md` status table + the next-action handoff.
3. **Append** `journal.md` (what happened).
4. **Update** `plan.md` status.
5. **One docs commit.**

## The promotion rule (why this system exists)

`.feature-dev/<ts>/` is **scratch** — gitignored, ephemeral (a cleanup hook deletes old runs). The initiative dir is the **SSOT** — checked in, loaded every session. The single discipline that makes the system reliable: **at every gate (a `/feature` Gate A/B/C, an ultracode phase, or a planning pass), promote the durable decisions + their rationale into `decisions.md`/`deferred.md`/`journal.md`.** This is enforced by the close-out protocol, the `/initiative-close` skill, the SessionStart hook, and the project `CLAUDE.md` rule — it does not depend on the model remembering.

## Decisions vs working state — doc-map

| Home                                                               | Holds                                                                                   |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `docs/adr/`                                                        | durable cross-initiative architecture decisions (the big WHY)                           |
| `docs/` (roadmap, runbooks, personas, `planner-discipline.md`)     | curated project docs + the planner read/verify-then-spec checklists                     |
| `initiatives/<slug>/decisions.md`                                  | step-level ratified decisions (the initiative's WHY)                                    |
| `initiatives/<slug>/deferred.md`                                   | carry-forwards / WARNINGs with disposition                                              |
| `initiatives/<slug>/{charter,plan,state,journal}.md` + design docs | WHERE WE ARE                                                                            |
| `initiatives/ACTIVE`                                               | the active slug (the SessionStart hook reads it)                                        |
| `analysis/`                                                        | training-domain reference corpus (`source/` sacred) + pre-pivot derivation (history)    |
| `implementation/`                                                  | pre-pivot execution log — **SUPERSEDED history**; live facts migrated to the initiative |
| `.feature-dev/<ts>/`                                               | gitignored scratch — promote out of here at every gate                                  |
| memory                                                             | cross-session pointers (active initiative, durable feedback)                            |

## Starting a new initiative

Copy `_template/` to `initiatives/<slug>/`, fill `charter.md`, seed `plan.md`, create the empty `decisions.md`/`deferred.md` (the template has them), set `initiatives/ACTIVE` to `<slug>`, and point memory at it.

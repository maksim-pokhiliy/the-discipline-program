# Implementation log

> Per-step append-only journal. One file per closed sub-step. Newest entries at top of `state/01-step-queue.md` Step queue. Historical archive (Steps 1 → 8.0a) preserved in `_archive-pre-refactor.md` (pre-2026-05-18 monolith format).

## File naming

- `step-NN.md` — closed step entry (e.g., `step-08.0a.md`, `step-08.0b.md`). Sub-steps use dotted notation matching `implementation/step-NN/` directory.
- `_archive-pre-refactor.md` — full historical IMPLEMENTATION_LOG.md preserved from pre-2026-05-18 monolithic format (Steps 1 → 7.5 + Step 8.0a). Read for historical context of earlier steps; new entries from Step 8.0b forward use individual files.

## Entry format

Each `step-NN.md` follows:

```markdown
# Step NN — <short title>

- **Date**: YYYY-MM-DD
- **Feature-dev artifacts**: `.feature-dev/<ts>/` (if `/feature` was used)
- **Prompt**: `implementation/step-NN/prompt.md`
- **Output**: `implementation/step-NN/output.md`

## Summary

[3-5 line synopsis of what changed]

## Open questions resolved

[D-decisions + Q-questions surfaced during execution]

## Deferred decisions / carry-forwards

[new carry-forwards + pre-existing references к state/03-deferred.md]

## Analysis-artifacts touched

[paths under analysis/artifacts/05-synthesis/ or 06-formalization/ updated, or "none"]

## Smoke-test status

passed/blocked/N/A

## Process note

[planner-discipline observations; lessons learned; next planner action pointer]
```

## How to use

**On step close-out** (planner):

1. Write new `log/step-NN.md` entry mirroring above format.
2. Update `state/00-current.md` paragraph к reflect new close-out.
3. Update `state/01-step-queue.md` — mark step COMPLETED + add new sub-steps if decomposition expanded.
4. Update `state/03-deferred.md` — add new carry-forwards + cross-reference closed ones.
5. Update `state/04-next-action.md` — shift to next step thesis cycle.
6. Single commit `docs(planning): close out step NN and queue step NN+1 thesis` (or combined refactor commit when applicable).

**On fresh planner session resume** (planner):

1. Read `WORKFLOW.md` (durable rules)
2. Read `state/00-current.md` (entry point)
3. Read `state/04-next-action.md` (concrete handoff)
4. Read last 2-3 `log/step-*.md` entries for recent context
5. Read relevant `state/0X-*.md` files as needed (decisions/deferred/step-queue per topic)

Older context lives в `_archive-pre-refactor.md` (pre-2026-05-18 monolith) — open only when investigating specific historical step.

## Why split (rationale)

Pre-2026-05-18 implementation/ structure was monolithic: single `PLANNING_STATE.md` (313 lines, ~38k tokens в one paragraph) + single `IMPLEMENTATION_LOG.md` (720 lines). Reading these in a fresh planner session consumed ~80-100k tokens just for orientation. Refactored 2026-05-18 to mirror the analysis/ pattern (categorized folders) — fresh session orientation drops к ~10-15k tokens; per-close-out edits target 2-3 small files instead of two monoliths.

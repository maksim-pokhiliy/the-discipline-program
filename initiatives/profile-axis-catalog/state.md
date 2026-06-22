# profile-axis-catalog — state (the board)

**Updated:** 2026-06-22. **Founded — pulls the profile-type-catalog carry-forward out of athlete-core into its own 3-wave initiative.** W1 (catalog + admin) prompt PREPARED (`w1-feature-prompt.md`) for a separate executor session — this planning session is paper-only. The ontology is RATIFIED (D-1/D-2); the sacred-VO change (D-3) is OPEN-gated to W2 (needs a plan-editor-compose ratification + four-projection re-check BEFORE any byProfile-VO code). W1 deliberately touches NONE of that — it's the isolated `ProfileAxis` catalog + an admin CRUD module (labels/exercises pattern), visible in admin, zero load-VO/resolver/athlete-profile radius.

## Board

| #   | Step                      | Status          | Pointer                                                                 |
| --- | ------------------------- | --------------- | ----------------------------------------------------------------------- |
| 0   | Found + ontology lock     | ✅ done         | charter · decisions D-1/D-2/D-3 · journal 2026-06-22                    |
| 1   | Catalog + admin           | 📝 prompt ready | W1 — `w1-feature-prompt.md` (run in an executor session)                |
| 2   | Coach binding (sacred-VO) | ⬜ pending      | D-3 gate: plan-editor-compose decision + four-projection re-check FIRST |
| 3   | Athlete two-layer profile | ⬜ pending      | curated picker + write-back by kind + selections migration              |

## Next action

**▶ Run W1 in a separate EXECUTOR session** — open it, `/initiative-resume` (loads this board + charter + decisions), then `/feature` with **`w1-feature-prompt.md`** (the self-contained W1 brief: `ProfileAxis` model + migration + contract + CRUD + admin module; mirror labels/exercises; the lms resolver must NOT read `ProfileAxis`; api-server suite is GATED). After: owner smoke on dev (admin app). **This planning session writes paper only — it does not run `/feature`.**

## Open decisions awaiting ratification

- **D-3** — byProfile axis → discriminated union (`catalog | human`). Owner-APPROVED in concept (2026-06-22); RATIFICATION GATE before W2 code: (1) add a cross-ref decision to `plan-editor-compose/decisions.md`, (2) run the four-projection re-check on the changed VO. **Do NOT touch the byProfile VO in W1.**

## Live carry-forwards (see deferred.md)

PAC-1 existing byProfile-load migration (W2) · PAC-2 `profileSelections` key migration (W3) · PAC-3 masters/age as a human attribute (default: custom axis) · PAC-4 `ProfileAxisValue` table (deferred — `String[]` now) · PAC-5 per-coach axis scoping (global now) · PAC-6 full-cartesian cells UX as axis-values grow · PAC-7 plan-editor-compose four-projection re-check + cross-ref decision (W2 gate).

## Gotchas a resuming session must know

- **W1 must NOT touch the sacred `byProfile` load VO** — that's W2, gated on D-3 + a four-projection re-check in plan-editor-compose. W1 is the catalog table + admin CRUD only.
- **gender is NOT absorbed** (D-1) — it stays a typed column with 7 coach-facing read sites; the catalog holds training-classification axes ONLY. The human/training split IS the point.
- **The resolver never reads `ProfileAxis`** — resolution uses the load VO (axisId + cells) + the profile's selections; this keeps the lms→coaching boundary clean across W2/W3.
- **This re-homes athlete-core's deferred profile-type catalog** — at close-out, mark that athlete-core carry-forward (`state.md` library-wave row + `deferred.md`) as PROMOTED here.

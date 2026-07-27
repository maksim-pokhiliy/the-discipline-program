/fix athlete records: first-ever 1RM is unloggable (movement picker scoped to own records) + RX/SC spread lines clip mid-token on phones

## How to run this

**Run the standard `/fix` pipeline exactly as the skill prescribes** — investigation, findings, fix plan, the plan-approval gate, fix agents, review, verify, PR. Everything in this prompt is INPUT to that pipeline (evidence, ratified constraints, scope boundaries, acceptance) — it does not replace or skip any stage, gate, task tracking, or artifact of the skill. Plan the TWO findings below as one batch on one branch. One heads-up for the plan-approval gate: present the plan and wait — the owner takes it for an external tech-lead review before answering the gate question.

Initiative context: this batch is `post-uat` PU-01 + PU-02 (pick `post-uat` if the session-start hook asks). SSOT: `initiatives/post-uat/triage.md` §§ PU-01..PU-02 and `decisions.md` D-6. **W1 was cut from four findings to two at the owner's corpus read** — the level-switch visibility and the 1RM-correction items went to a design round; do NOT pull them or their contract deltas in. Out-of-scope discoveries go to `initiatives/post-uat/deferred.md` as notes, not into the diff.

## Finding 1 (PU-01) — a first-ever 1RM is unloggable: the movement picker only offers movements the athlete already has records for

Symptom (prod, UAT): athlete opens Records → UPDATE 1RM → types `squat` → "No options"; a fresh athlete has a permanently empty picker.

Tech-lead recon evidence (a head start — verify against the current tree, then use; re-prove the empty-picker repro end-to-end on a fresh-athlete fixture before building): the autocomplete is fed from the athlete's own 1RM records (`apps/platform/src/modules/athlete-records/components/records-content.tsx:186-194` maps `data.oneRM`), a deliberate swap in commit `bb6ed890` because the full-catalog endpoint is coach-gated: `apps/platform/src/app/api/platform/exercises/route.ts:16` (`withCoachAuth`) + `packages/api-server/src/endpoints/lms/exercise/platform.ts:12` (`requireCoachLikeRole`), pinned by `platform.test.ts:53-62`.

Ratified design (D-6 = a): athletes get a READ-ONLY movement catalog — an athlete-authorized read (CONCRETE-nature movements only; PLACEHOLDER/REST must not appear), offered in the picker as the union with the athlete's own record movements. The coach-only endpoint and its 403 test stay exactly as they are. Useful mirrors: `athlete/records/route.ts` (athlete route shape), `use-exercises.ts` (catalog hook shape), the existing `OneRmMovementOption` `{exerciseId, exerciseName}` option shape.

Desired behavior: any athlete (including one with zero records) can find any concrete movement and log a first-ever 1RM from Records.

## Finding 2 (PU-02) — RX/SC spread lines clip mid-token on phones

Symptom (prod screenshot): "18 reps RX Male:24 Female:16 / SC Male:16 Female:…" — cut mid-token; the athlete cannot see the Scaled-Female value.

Evidence: the spread is a single unbreakable run — `whiteSpace: "nowrap"` (`apps/platform/src/modules/athlete-session/components/schema-row.tsx:154-166`), `flexShrink: 0` on group-member lines (`.../row-group.tsx:94-103`), clipped by the card's `overflow: hidden` (`schema-card.tsx:49-55`).

Desired behavior: spread lines wrap on narrow screens (320–430px) — no mid-token clipping anywhere in the day view, no overlap with neighboring line elements. Boundary: do NOT redesign the line into chips/grouped renders — that belongs to the session-screen-v2 initiative.

## Scope boundaries (ratified — not negotiable within this batch)

- Contract change ADDITIVE ONLY and exactly ONE: the athlete movement-catalog response schema. No other contract deltas — the resolved-coords and exercise-identity fields that earlier drafts mentioned belong to the deferred design-round items, NOT here.
- **ZERO diff on `packages/contracts/src/entities/lms/_shared/load.ts` and `reps.ts`** (sacred VOs).
- **ZERO diff under `packages/api-server/src/endpoints/coaching/mobile-publish/`** — published legacy text must stay byte-identical (D-17 parity); verify with the projection suite.
- The coach-only `/api/platform/exercises` endpoint and its 403 test stay untouched.
- House UI rules: MUI, palette tokens only (no hex), one component per file, no code comments.
- Tests: platform runs via the root vitest runner with a project filter (apps/platform has no own `test` script); api-server touched files in isolation; the full serial api-server suite only at your discretion (standing approval; ~10 min serial, live Neon dev). Known pre-existing flake: `notes-list-editor.test.tsx` load-timeout under the full platform suite.
- ONE branch for the batch; suggested slug: `uat-athlete-pack`. PR against `main` (`main` is PR-only, squash merges).

## Acceptance (owner verifies on prod after merge)

- A fresh athlete can log a first-ever 1RM for any concrete movement; typing `squat` offers catalog movements; PLACEHOLDER/REST never appear.
- No mid-token clipping of spread lines at phone widths (320–430px).
- A coach-account probe of `/api/platform/exercises` still 403s athletes.
- check-types / lint / dep:check green; touched tests green.

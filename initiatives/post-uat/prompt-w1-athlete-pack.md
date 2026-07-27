/fix athlete-core UAT pack: first-ever 1RM unloggable, RX/SC spread clipping, active level invisible in the workout, in-session 1RM uncorrectable

## How to run this

**Run the standard `/fix` pipeline exactly as the skill prescribes** — investigation, findings, fix plan, the plan-approval gate, fix agents, review, verify, PR. Everything in this prompt is INPUT to that pipeline (evidence, ratified design constraints, scope boundaries, acceptance) — it does not replace or skip any stage, gate, task tracking, or artifact of the skill. Plan the FOUR findings below as one batch on one branch. One heads-up for the plan-approval gate: present the plan and wait — the owner takes it for an external tech-lead review before answering the gate question.

Initiative context: this batch is `post-uat` PU-01..PU-04 (pick `post-uat` if the session-start hook asks). SSOT: `initiatives/post-uat/triage.md` §§ PU-01..PU-04 and `decisions.md` D-5/D-6. Out-of-scope discoveries go to `initiatives/post-uat/deferred.md` as notes, not into the diff.

## Finding 1 (PU-01) — a first-ever 1RM is unloggable: the movement picker only offers movements the athlete already has records for

Symptom (prod, UAT): athlete opens Records → UPDATE 1RM → types `squat` → "No options"; a fresh athlete has a permanently empty picker.

Tech-lead recon evidence (a head start — verify, then use): the autocomplete is fed from the athlete's own 1RM records (`apps/platform/src/modules/athlete-records/components/records-content.tsx:186-194` maps `data.oneRM`), a deliberate swap in commit `bb6ed890` because the full-catalog endpoint is coach-gated: `apps/platform/src/app/api/platform/exercises/route.ts:16` (`withCoachAuth`) + `packages/api-server/src/endpoints/lms/exercise/platform.ts:12` (`requireCoachLikeRole`), pinned by `platform.test.ts:53-62`.

Ratified design (D-6 = a): athletes get a READ-ONLY movement catalog — an athlete-authorized read (CONCRETE-nature movements only; PLACEHOLDER/REST must not appear), offered in the picker as the union with the athlete's own record movements. The coach-only endpoint and its 403 test stay exactly as they are. Useful mirrors: `athlete/records/route.ts` (athlete route shape), `use-exercises.ts` (catalog hook shape), the existing `OneRmMovementOption` `{exerciseId, exerciseName}` option shape.

Desired behavior: any athlete (including one with zero records) can find any concrete movement and log a first-ever 1RM from Records.

## Finding 2 (PU-02) — RX/SC spread lines clip mid-token on phones

Symptom (prod screenshot): "18 reps RX Male:24 Female:16 / SC Male:16 Female:…" — cut mid-token; the athlete cannot see the Scaled-Female value.

Evidence: the spread is a single unbreakable run — `whiteSpace: "nowrap"` (`apps/platform/src/modules/athlete-session/components/schema-row.tsx:154-166`), `flexShrink: 0` on group-member lines (`.../row-group.tsx:94-103`), clipped by the card's `overflow: hidden` (`schema-card.tsx:49-55`).

Desired behavior: spread lines wrap on narrow screens (320–430px) — no mid-token clipping anywhere in the day view. Boundary: do NOT redesign the line into chips/grouped renders — that belongs to the session-screen-v2 initiative.

## Finding 3 (PU-03) — the active level is invisible in the workout and unswitchable in place

Symptom (UAT, owner-refined): the RX/SC switch works on the Profile page (active pick highlighted there), but the WORKOUT screen never confirms it — a resolved byProfile row shows a bare kg number, so after a switch the number changes silently; there is no in-session control to re-switch; rows inside a group never had a picker at all.

Evidence: the resolved arm carries only `{kg, perHand}` (`packages/contracts/src/entities/lms/session-detail/session-detail.schema.ts:20-21`); the prompt exists only for unresolved states (`.../utils/athlete-session-presentation.ts:188-224`); `RowGroup` gets no `editor` (`.../components/schema-card.tsx:123`; `row-group.tsx:31-37` discards prompts); the server knows the resolved coords at `packages/api-server/src/endpoints/lms/athlete-records/resolve-load.ts:86-91`.

Desired behavior (additive-only contract changes): a resolved byProfile row NAMES its resolved coordinates next to the value (e.g. "24 kg · RX"; include the gender coord where it disambiguates — copy judgment yours, keep it short); a resolved row with a pickable (non-gender-bound) axis stays tappable and re-opens the picker, re-picking re-resolves value + label; rows inside groups get the same affordances as standalone rows.

## Finding 4 (PU-04) — an in-session 1RM is write-once; a typo is uncorrectable

Symptom (UAT, FB message): "where you must enter a weight, you can write it only once — no way to replace a mistake."

Evidence: the `% of 1RM` prompt is a create-only POST (`use-session-logging.ts:147-172` → `packages/api-server/src/endpoints/lms/one-rm-record/admin.ts:8-24`) and the entry point self-destructs once the load resolves (`schema-row.tsx:167`); the rowView contract carries no exercise identity on resolved rows (mirror how the unresolved missing-1RM state carries it). Secondary wedge: the idempotency submit token resets only on success (`packages/query/src/hooks/use-submit-token.ts:20-44`; consumers `use-one-rm-records.ts` / `use-benchmark-results.ts`) — a persisted-but-unseen 2xx makes every corrected retry 409 until remount.

Ratified design (D-5): correction is an APPEND — a resolved percentage row exposes an edit affordance that re-opens the 1RM editor and appends a new record (latest-wins resolution is already the law); NO PATCH/DELETE endpoints, no history editing. The token wedge should also die (reset on settle, not only success).

Desired behavior: a mistyped in-session 1RM is correctable from the day view; Records history keeps both entries; the resolved kg updates after correction.

## Scope boundaries (ratified — not negotiable within this batch)

- Contract changes ADDITIVE ONLY (athlete movement catalog response; resolved-arm coords; exercise identity on resolved rows). **ZERO diff on `packages/contracts/src/entities/lms/_shared/load.ts` and `reps.ts`** (sacred VOs).
- **ZERO diff under `packages/api-server/src/endpoints/coaching/mobile-publish/`** — published legacy text must stay byte-identical (D-17 parity).
- The coach-only `/api/platform/exercises` endpoint and its 403 test stay untouched.
- House UI rules: MUI, palette tokens only (no hex), one component per file, no code comments.
- Tests: platform runs via the root vitest runner with a project filter (apps/platform has no own `test` script); api-server touched files in isolation; the full serial api-server suite only at your discretion (standing approval; ~10 min serial, live Neon dev). Known pre-existing flake: `notes-list-editor.test.tsx` load-timeout under the full platform suite.
- ONE branch for the whole batch; suggested slug: `uat-athlete-pack`. PR against `main` (`main` is PR-only).

## Acceptance (owner verifies on prod after merge)

- A fresh athlete can log a first-ever 1RM for any concrete movement; typing `squat` offers catalog movements.
- No mid-token clipping of spread lines at phone widths.
- A resolved byProfile row names its level; the level is switchable in place (including inside groups); switching visibly updates kg + label.
- A mistyped in-session 1RM is correctable from the day view; Records history keeps both entries (append semantics).
- check-types / lint / dep:check green; touched tests green.

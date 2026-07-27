/fix athlete-core UAT pack: athlete 1RM movement catalog, RX/SC spread wrapping, active-level visibility + in-session re-pick, 1RM append-correction path

## Session setup

This session works the `post-uat` initiative — pick `post-uat` if the session-start hook asks. SSOT: `initiatives/post-uat/triage.md` §§ PU-01..PU-04 (evidence + file anchors + verify-after per item) and `decisions.md` D-5/D-6. Scope is FIXED: the four items below, ONE branch. Anything discovered out of scope goes as a note into `initiatives/post-uat/deferred.md`, not into the diff.

## Items

### 1 · PU-01 — athlete read-only movement catalog for Update 1RM (D-6 = a)

Today the Update-1RM Movement autocomplete is fed ONLY from the athlete's own 1RM records (`apps/platform/src/modules/athlete-records/components/records-content.tsx:186-194`) — a fresh athlete has a permanently empty picker and a first-ever 1RM is unloggable. The full-catalog endpoint is coach-gated and must STAY coach-gated (`apps/platform/src/app/api/platform/exercises/route.ts:16` `withCoachAuth`; `packages/api-server/src/endpoints/lms/exercise/platform.ts:12` `requireCoachLikeRole`; pinned by `platform.test.ts:53-62`).

Build: a sibling `listForAthlete` on the exercise endpoint (no coach guard; `nature: CONCRETE` only; select `{id, canonicalName}`; ordered by `canonicalName`) + a new route `apps/platform/src/app/api/platform/athlete/movements` (mirror `athlete/records/route.ts` — `withAthleteAuth` + rate limit) + an additive contract response schema matching the existing `OneRmMovementOption` shape (`{exerciseId, exerciseName}`) + query key & hook (`staleTime: Infinity`, mirror `use-exercises.ts`) + feed the modal with the union catalog ∪ own-record movements (dedupe by `exerciseId`). PLACEHOLDER/REST natures must NOT appear.

Tests: the endpoint resolves for an athlete and excludes non-CONCRETE; `records-content` offers a catalog-only movement the athlete has no record for.

### 2 · PU-02 — RX/SC spread lines must wrap on phones

Unresolved byProfile lines render the full spread ("RX Male:24 Female:16 / SC Male:16 Female:12") as an unbreakable run clipped by the card: `whiteSpace: "nowrap"` (`apps/platform/src/modules/athlete-session/components/schema-row.tsx:154-166`), `flexShrink: 0` on group-member lines (`.../row-group.tsx:94-103`), clipping via the card's `overflow: hidden`. Fix minimally: allow wrapping (`overflowWrap: "anywhere"`, drop the nowrap; `minWidth: 0` instead of the flexShrink pin). Verify no mid-token clipping anywhere in the day view at 320–430px. Do NOT redesign the line into chips/grouped rows — that belongs to the session-screen-v2 initiative.

### 3 · PU-03 — make the active level visible + re-switchable in the workout

The RX/SC switch itself works (the Profile page picks card correctly highlights the active variant). The WORKOUT screen is the gap: a resolved byProfile line renders a bare kg number — the resolved arm carries only `{kg, perHand}` (`packages/contracts/src/entities/lms/session-detail/session-detail.schema.ts:20-21`) — the prompt disappears once resolved (`apps/platform/src/modules/athlete-session/utils/athlete-session-presentation.ts:188-224`), and rows inside a `RowGroup` never render prompts at all (`.../components/schema-card.tsx:123` passes no `editor`; `row-group.tsx:31-37` discards them).

Build, additive-only:

- **(a)** resolved byProfile lines carry and display the resolved coordinates — e.g. "24 kg · RX" (the server knows the coords at `packages/api-server/src/endpoints/lms/athlete-records/resolve-load.ts:86-91`; add an additive field on the resolved arm and render it; include the gender coord where it disambiguates — copy judgment is yours, keep it short).
- **(b)** resolved byProfile lines with a pickable (non-gender-bound) axis keep a prompt labeled with the current value (e.g. "RX ▾") that re-opens `InlineProfilePicker`, so the athlete can re-switch in place; re-picking re-resolves the kg + label.
- **(c)** `RowGroup` receives the `editor` wiring and renders per-member prompts (mirror `schema-row.tsx:143-169`).

Tests at the presentation level: resolved line exposes the coords label; resolved byProfile returns a re-open prompt; group members expose prompts.

### 4 · PU-04 — 1RM correction path (D-5: append, never history-edit)

The in-session 1RM prompt on `% of 1RM` rows is create-only and self-destructs on resolve (`use-session-logging.ts:147-172` → `packages/api-server/src/endpoints/lms/one-rm-record/admin.ts:8-24`; prompt gone via `schema-row.tsx:167`) — a typo is uncorrectable from the day view.

Build, additive-only: thread the exercise identity to RESOLVED percentage rows (mirror how the unresolved missing-1RM state carries it — an additive contract field), and have `buildLoadLine` return an "Edit 1RM"-style prompt for resolved percentage loads that re-opens `InlineOneRmEditor`; submitting APPENDS a new `OneRMRecord` — latest-wins resolution is already the law, so NO server change, NO PATCH/DELETE endpoints. Also: reset the idempotency submit token in `onSettled` (not only on success) — `packages/query/src/hooks/use-submit-token.ts:20-44`, consumers `use-one-rm-records.ts` / `use-benchmark-results.ts` — this kills the 409 wedge after a persisted-but-unseen 2xx.

Tests: a resolved `% of 1RM` row exposes the edit prompt; a correction appends and the resolved kg updates; the token resets on error.

## Constraints

- Contract changes ADDITIVE ONLY (athlete-movements response; resolved-arm coords; exercise identity on resolved rows). **ZERO diff on `packages/contracts/src/entities/lms/_shared/load.ts` and `reps.ts`** (sacred VOs).
- **ZERO diff under `packages/api-server/src/endpoints/coaching/mobile-publish/`** — published legacy text must stay byte-identical (D-17 parity).
- The coach-only `/api/platform/exercises` endpoint and its 403 test stay untouched.
- House UI rules: MUI, palette tokens only (no hex), one component per file, no code comments.
- Tests: platform runs via the root vitest runner with a project filter (apps/platform has no own `test` script); api-server touched files in isolation; the full serial api-server suite only at your discretion (standing approval; ~10 min serial, live Neon dev). Known pre-existing flake: `notes-list-editor.test.tsx` load-timeout under the full platform suite.
- ONE branch `fix/uat-athlete-pack`, PR against `main` (`main` is PR-only). Conventional commits, lowercase subjects, no AI trailers/signatures anywhere.

## Acceptance (owner verifies on prod after merge)

- A fresh athlete can log a first-ever 1RM for any concrete movement; typing `squat` offers catalog movements.
- No mid-token clipping of spread lines at phone widths.
- A resolved byProfile row names its level; the level is switchable in place (including inside groups); switching visibly updates kg + label.
- A mistyped in-session 1RM is correctable from the day view; Records history keeps both entries (append semantics).
- check-types / lint / dep:check green; touched tests green.

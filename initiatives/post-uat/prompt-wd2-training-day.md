/feature training day: the sourced-weight chip — every resolved weight names its source and opens control (level sheet / fix-my-max), with the applied moment

## How to run this

**Run the standard full `/feature` pipeline exactly as the skill prescribes** — research, plan, the plan-approval gate, implementation, review, verify, PR. Everything in this prompt is INPUT to that pipeline (evidence, ratified constraints, scope boundaries, acceptance) — it does not replace or skip any stage, gate, task tracking, or artifact of the skill. One heads-up for the plan-approval gate: present the plan and wait — the owner takes it for an external tech-lead review before answering the gate question.

Initiative context: this is `post-uat` wave **Wd-2** (pick `post-uat` if the session-start hook asks) — the core wave of the Wd design round (D-9), closing the PU-03 and PU-04 pains. SSOT for the design: `initiatives/post-uat/design-wd.md` §§ "The language" / "Chip states" / "Sheet flows" (with the verbatim microcopy) and the live prototype (Claude Design project `2d57f2e4-cd74-4184-9c9e-746f83266a60`, files `Training Day.dc.html` + `Training Day - Provenance Spec.dc.html`, readable via the DesignSync MCP). Ratified deltas AFTER the prototype: **the S5 remote-change banner is CUT (D-14)** — do not build it; the sheet container is pinned (D-14): phone = MUI `Drawer anchor="bottom"`, desktop = the house dialog. Out-of-scope discoveries go to `initiatives/post-uat/deferred.md`.

## The problem (two UAT pains, one mechanism)

PU-03: a resolved per-profile weight renders as a bare number — nothing names the level that produced it, nothing marks a switch applying, no in-session re-switch exists, and grouped rows never render a picker at all. A real athlete switched levels on her profile, everything recalculated, and she could not perceive it. PU-04: on "% of 1RM" rows the entry prompt self-destructs after the first save — a typo is uncorrectable from the day view (secondary wedge: the idempotency submit token resets only on success, so a persisted-but-unseen 2xx makes every retry 409 until remount).

## Ratified design (build to `design-wd.md`, not from memory)

- **The chip:** a resolved weight always renders `value · source` — "24 kg · RX" / "16 kg · RX · Female" / "96 kg · 80% of 120" — with the dotted-accent underline on the source (= "managed value"); the WHOLE chip is one control (44px tap slop, chevron ≥360px, hidden at 320). Authored absolutes stay bare — no source, no underline, no tap. Source ellipsizes past ~55% of row width; the sheet always shows the full text.
- **Unpicked states speak:** one axis unpicked → the cells ("M: 43 / F: 30 kg · Pick your gender" — axis name verbatim); two axes → the range ("12–24 kg · Pick your level"); no max → "70% · Set your max".
- **Level sheet** (Drawer bottom / desktop dialog): the SAME option rows and outcome strips Wd-1 built for the profile — same three selected signals, same Applying flight, same tokens — plus what the profile does not have: a pre-commit preview ("This row · DB Snatch: 16 kg → 12 kg") and the honest scope line ("Applies to 2 weights in this session — and this whole plan"); CTA "Apply RX · Female" (disabled: "Pick level & gender").
- **Fix-my-max sheet:** header "Your <movement> max / This plan asks for 80% of it", context "Latest record · 120 kg · 12 Jul 2026" (+ the source tag — note `OneRMRecordSource` has THREE values: MANUAL / TESTED / **AUTO_INFERRED**, the prototype shows only two; give the third a label), input, helper "Corrections add a newer record — the latest wins. Full history lives on Records." Saving appends (D-5) and the row's number updates in place. The prompt NEVER disappears for good — the source label of a resolved percentage row IS the control.
- **The applied moment:** a ~1.4s pulse on EVERY affected row (not just the tapped one) + a receipt ("Scaled · Female applied · 2 weights updated" / "Back Squat 1RM · 125 kg saved"). No banner (D-14).
- **Groups: zero variation** — grouped rows render the identical chip; if the volume cluster cannot fit beside the name it wraps whole onto its own line, never compresses into a different control.

## Tech-lead recon evidence (a head start — verify against the current tree, then use)

**Contract (`packages/contracts/src/entities/lms/session-detail/session-detail.schema.ts`):** `resolvedLoadSchema`'s RESOLVED arm is `{status, kg, perHand}` — no coords, no exerciseId, no percent base. The UNRESOLVED arms already carry `exerciseId` (missing_one_rm) and `axisLabels` (profile arms). `rowViewSchema` already ships the FULL authored `load` (the whole byProfile grid) — the sheet preview ("16 → 12") and the unpicked cell/range labels are CLIENT-side derivations, no new grid plumbing.

**The additive set this wave needs (recommended shape — server-side SSOT, do not re-derive resolution on the client):** on the resolved arm — the resolve coordinates (for the source label), and for percentage loads the base 1RM value + `exerciseId` (for "80% of 120" and for the fix-my-max sheet). `packages/api-server/src/endpoints/lms/athlete-records/resolve-load.ts` computes `wantedCoords` at :86 — the data exists at the exact point the arm is built. Additive only; nothing existing renamed or reshaped.

**Publish-projection safety:** `endpoints/coaching/mobile-publish/` does NOT import session-detail (verified by grep) — the contract additives cannot move published bytes. Still prove it: run the projection suite (D-17) and say so in the PR.

**UI chain (`apps/platform/src/modules/athlete-session/`):** `utils/athlete-session-presentation.ts` builds the load-cell models (`ResolvedLoadCell {state, value}`; `resolveUnresolvedCell` already threads `exerciseId`/`axisLabels`/`formatProfileSpread`); `components/schema-row.tsx` renders them (W1's wrap fixes live here — `flex: "0 1 auto"`, flex-end, `overflowWrap: "anywhere"`; do not regress them, the chip must survive 320px inside them); `components/row-group.tsx` (W1: `useFlexGap`; today it DISCARDS prompts — this wave ends that); existing pickers `inline-profile-picker.tsx`, `inline-gender-picker.tsx`, `inline-one-rm-editor.tsx`, `load-prompt-button.tsx`, and the session-local `profile-option-button.tsx` (the Wd-1 namesake that survived) — their fate (replaced by the sheet vs internally reused) is your plan's call, but the END state has ONE picker language: the sheet. `utils/use-session-logging.ts`: `pickProfile` (closes the popover on success today) and the create-only 1RM POST; **include the PU-04 secondary wedge: reset the submit token in `onSettled`, not only on success**.

**Wd-1 reuse (this is the second call site the Wd-1 deferred entry was waiting for):** `athlete-profile/components/profile-option-row.tsx` + `profile-axis-outcome-strip.tsx`, the `profile-coordinates` builders, and the flight pattern from `use-profile-level-switch.ts`. They move to a shared home (your plan decides where — an `apps/platform` shared module vs `@repo/ui`; the profile page's behavior and its 127 tests must survive the move unchanged apart from import paths).

**Sheet container:** `Drawer anchor="bottom"` (temporary/modal — renders above the global `PlatformBottomNav`; if you ever go non-modal you owe the `platformBottomNavHeight` offset), desktop = the house dialog pattern. The level switch mutation: the profile page routes through `useSwitchAthleteProfileLevel` (toast-free, per-axis strips) — the session sheet almost certainly wants the same toast-free route with its own outcome surface; `use-session-logging.ts`'s in-session `profileSelections` staging is one of the five call sites that deliberately KEPT the toast (D-13) — reconcile that in your plan.

## Scope boundaries (ratified — not negotiable within this batch)

- Contract changes ADDITIVE ONLY (the resolved-arm set above). **ZERO diff on `packages/contracts/src/entities/lms/_shared/load.ts` and `reps.ts`** (sacred VOs). **ZERO diff under `packages/api-server/src/endpoints/coaching/mobile-publish/`** — published bytes stay byte-identical (D-17); projection suite green is part of verify.
- The S5 banner is CUT (D-14) — no last-seen state, no banner component.
- Records page = Wd-3; the profile PAGE's behavior = done (Wd-1) — component moves only, no behavior change there.
- House rules: MUI, palette tokens only (map the prototype's hex to theme slots), no px layout sizing, one component per file, no code comments, files < 300 lines.
- Tests: platform via the root vitest runner with a project filter; api-server touched files in isolation; the full serial api-server suite at your discretion (standing approval; ~10 min, live Neon dev). Known flake: `notes-list-editor.test.tsx` under the full platform suite.
- ONE branch; suggested slug: `feat/session-sourced-weight-chip`. PR against `main` (PR-only, squash).

## Acceptance (owner verifies in the browser before merge)

- Every resolved weight reads `value · source` with the underline; authored absolutes stay bare and untappable; the chip is one target and opens the bottom Drawer on a phone / the dialog on desktop.
- Level flow: the sheet shows the SAME rows as the profile page (three signals, Applying, old Current held until commit), the pre-commit preview and the scope line; Apply → the sheet closes onto a pulse across ALL affected rows + the receipt naming full coordinates and the count.
- Percentage flow: "96 kg · 80% of 120" → the sheet shows the latest record (with a source tag incl. AUTO_INFERRED) → saving appends, the number updates in place, the receipt names the new max; a resolved row can be corrected again immediately (no dead end, no 409 wedge after an unseen 2xx).
- Unpicked states: cells / range / set-max labels verbatim from the spec; the FIRST pick works from inside a group; grouped rows are pixel-identical in chip behavior to plain rows.
- 320px inside a superset with a 100-char axis value: the source ellipsizes, the sheet shows the full text, W1's wrap behavior is not regressed.
- Projection suite green (published bytes unmoved); profile-page tests green with only import-path changes; check-types / lint / dep:check green.

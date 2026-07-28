/feature small athlete profile: replace the level-pick buttons with the ratified radio-row switcher (selection state + applied moment)

## How to run this

**Run the standard `/feature small` pipeline exactly as the skill prescribes** — investigation, plan, the plan-approval gate, implementation, review, verify, PR. Everything in this prompt is INPUT to that pipeline (evidence, ratified constraints, scope boundaries, acceptance) — it does not replace or skip any stage, gate, task tracking, or artifact of the skill. One heads-up for the plan-approval gate: present the plan and wait — the owner takes it for an external tech-lead review before answering the gate question.

Initiative context: this is `post-uat` wave **Wd-1** (pick `post-uat` if the session-start hook asks) — the first of three execution waves from the Wd design round (D-9). SSOT for the design: `initiatives/post-uat/design-wd.md` § Profile (the distilled Level Switch Spec — states, microcopy, edge cases, the ratified component mapping) and the live prototype (Claude Design project `6540df99-f793-4f6c-beeb-2d1963cac094`, files `Athlete Profile v2.dc.html` + `Level Switch Spec.dc.html`, readable via the DesignSync MCP). Out-of-scope discoveries go to `initiatives/post-uat/deferred.md` as notes, not into the diff.

## The problem (UAT incident)

The athlete's level choice on the profile page is a column of plain MUI `Button`s whose only "selected" signal is the variant flipping to `contained`. A real athlete switched Scaled → RX here, the system honestly recalculated every weight — and she never understood a change had happened («не хоче твоя програма, шоб я була RX»). A button promises an action; it does not show a selection state, and no moment says "applied".

## Ratified design (D-9; build to `design-wd.md` § Profile, not from memory)

- Each pickable axis renders as its OWN card: axis header (+ state chip) and a **radio group of full-width option rows**. Selected row = three redundant signals (filled radio + accent border/tint + the word "Current"); tap on current = no-op.
- Tap another row → that row shows a spinner + "Applying…" while **the previous row keeps its full Current treatment until commit**; the group is locked for the flight. No frame where zero or two rows claim Current.
- On commit an **Applied strip appears inside the axis card** (never a floating toast): "Applied — training weights everywhere now resolve as <full resolved coordinates>." Auto-dismisses after ~5s; the persistent trace is a success chip with the value in the axis header. There is NO Save button and NO deep-link (the prototype's "See today's session" link is DROPPED — a plan day can hold several sessions).
- Failure: the tapped row reverts, the previous pick stays Current, an error strip shows "Couldn't apply. Your level is still <coordinates>." + Retry.
- Axis with no pick: a warning "Not picked" chip in the header + the helper copy from the spec.
- **Component mapping (ratified, not a suggestion):** `List` with `role="radiogroup"` → `ListItemButton` rows with `role="radio"` + `aria-checked`, a non-interactive MUI `Radio` as the indicator (`CircularProgress` in its place while applying) — the in-repo selection-list pattern (`day-source-list.tsx`, `week-source-list.tsx`); the Applied/failed strip = MUI `Alert` (`severity="success"`/`"error"`, Retry via `action`) inside a `Collapse`; the header chip = `@repo/ui` `IndicatorChip` (`tone="success"` / `"warning"`).

## Tech-lead recon evidence (a head start — verify against the current tree, then use)

The current chain: `apps/platform/src/modules/athlete-profile/components/profile-picks-card.tsx` (one shared card; pickable axes laid out in a `Grid` `xs:12 sm:6 md:4`) → `profile-pick-group.tsx` (axis header + a clear-pick `IconButton` when a value is active) → `profile-option-button.tsx` (the incident `Button` `variant={isActive ? "contained" : "outlined"}`). The design's one-card-per-axis replaces the shared-card Grid — check the prototype's layout tweaks (auto / mobile / desktop) for how cards flow at desktop widths.

Wiring: `views/athlete-profile-view.tsx:40` — `const { mutate, isPending } = useUpdateAthleteProfile()`; `handlePick`/`handleClearPick` at :124-125; the SAME `isPending` currently feeds `isSaving` into weight/height/details cards too. The design needs PER-AXIS flight state (which axis+value is applying) — keep the global `isPending` only as the lock; do not let one axis's flight paint "Applying…" on the others. Error feedback today is whatever `useUpdateAthleteProfile` does globally — the per-axis error strip with Retry is new; check the hook's `onError` so failures land in the axis card, not (only) a toast.

Existing test to migrate: `profile-picks-card.test.tsx:94` pins `MuiButton-contained` — it dies with the buttons; replace with role-based assertions (`radiogroup`/`radio`, `aria-checked`).

**Preserve the clear-pick capability.** The design does not show it, but clearing a pick is an existing function (`onClearPick`, the header `IconButton`) and the "Not picked" state exists in the design — keep clearing reachable in the new language (your plan decides where the control lives; dropping the capability is out of the question).

## Scope boundaries (ratified — not negotiable within this batch)

- **UI-only: ZERO diff in `packages/` (server, contracts, api-routes, api-client).** The pick already persists through the existing mutation.
- Training Day (the sourced-weight chip, the session sheet) is Wd-2; Records is Wd-3 — do not pull them in. The radio-row internals will be REUSED by Wd-2's sheet, so keep the row/strip components cleanly composable within the platform module (no premature `@repo/ui` promotion).
- Palette tokens only — the prototype's hex values (`#E07B35`, greens) map to the existing theme (`primary`/`success`/`warning` slots); no hex literals, no px layout sizing beyond the existing constants pattern.
- House rules: one component per file, no code comments, files < 300 lines.
- Tests: platform runs via the root vitest runner with a project filter (apps/platform has no own `test` script). Known pre-existing flake: `notes-list-editor.test.tsx` load-timeout under the full platform suite.
- ONE branch; suggested slug: `feat/profile-level-switcher`. PR against `main` (`main` is PR-only, squash merges).

## Acceptance (owner verifies in the browser before merge)

- Each axis is its own card; the selected row carries all three signals; tapping it does nothing.
- Tapping another row: spinner + "Applying…" on it, the old row keeps Current until commit; on commit the states swap and the green strip names the FULL resolved coordinates; it auto-dismisses and the success chip remains in the header.
- Failure path (dev-tools offline or a forced 500): the row reverts, the error strip appears with Retry, the previous pick still reads Current.
- An axis with no pick shows the warning chip + helper; clearing a pick still works and returns the axis to that state.
- 320px: full-width rows, nothing truncates; a long (up to 100-char) value wraps inside its row and ellipsizes in the header chip.
- `radiogroup`/`radio` + `aria-checked` roles present; keyboard focus visible.
- check-types / lint / dep:check green; migrated + new tests green; zero `packages/` diff.

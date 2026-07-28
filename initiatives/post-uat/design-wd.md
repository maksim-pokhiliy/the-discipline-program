# Wd — design-round outcome (the reference for the three execution waves)

Ratified 2026-07-28 (owner, on the tech-lead review). Prompts that produced it: `prompt-wd-{training-day,profile,records}.md` (page-split at the owner's constraint — his Claude Design workspace is 1 page = 1 prototype).

## Prototypes (Claude Design; import via the DesignSync MCP)

| Page         | Project id                             | Files                                                             |
| ------------ | -------------------------------------- | ----------------------------------------------------------------- |
| Training Day | `2d57f2e4-cd74-4184-9c9e-746f83266a60` | `Training Day.dc.html` · `Training Day - Provenance Spec.dc.html` |
| Profile      | `6540df99-f793-4f6c-beeb-2d1963cac094` | `Athlete Profile v2.dc.html` · `Level Switch Spec.dc.html`        |
| Records      | `a9a2db42-1917-4ebb-bc51-421a632d5080` | `Athlete Records.dc.html`                                         |

Raw `.dc.html` stays OUT of git — read via DesignSync at slicing time.

## The language (all three pages)

**The sourced-weight chip.** A resolved weight never renders as a bare number: always `value · source` ("24 kg · RX", "16 kg · RX · Female", "96 kg · 80% of 120"). The source label carries a dotted orange underline — the one mark meaning "managed value" everywhere — and the WHOLE chip is a single control (32px visual, 44px tap slop; chevron ≥360px, hidden at 320) that opens management: the level sheet, or the fix-my-max sheet. Authored absolutes stay bare — no source, no underline, no tap. Source ellipsizes past ~55% of row width; the sheet always shows full text.

**No silent renumbering.** A resolved number may change only with a visible moment attached: an in-place pulse (~1.4s) hitting EVERY affected row + a receipt ("Scaled · Female applied · 2 weights updated") when switched here; a one-time banner when changed elsewhere ("Weights updated — your level changed to RX · Female (Profile · 2 Jul). 2 weights here were recalculated." + Got it).

**Chip states (Training Day).** S1 `24 kg · RX` (one axis) · S2 `16 kg · RX · Female` (two axes) · S3 `96 kg · 80% of 120` (1RM-resolved; tap = the same sheet as fix-my-max — the prompt never disappears for good) · S0a unpicked level: one axis shows cells (`M: 43 / F: 30 kg · Pick your gender`), two axes show the range (`12–24 kg · Pick your level`) · S0b no max: `70% · Set your max` · S4 applied pulse + receipt · S5 remote-change banner. Grouped rows: ZERO variation — the identical chip; if the volume cluster can't fit beside the name it wraps whole onto its own line. Desktop ≥768px: the bottom sheet becomes a centered dialog.

**Sheet flows (Training Day).** Switch: tap chip → sheet with the SAME option rows as the profile page → preview BEFORE commit ("This row · DB Snatch: 16 → 12 kg" + "Applies to 2 weights in this session — and this whole plan") → CTA "Apply RX · Female" (disabled: "Pick level & gender") → pulse + receipt. Fix-my-max: sheet header "Your Back Squat max / This plan asks for 80% of it", context "Latest record · 120 kg · 12 Jul 2026", helper "Corrections add a newer record — the latest wins. Full history lives on Records" → number updates in place + receipt "Back Squat 1RM · 125 kg saved".

**Profile (Level Switch Spec).** Primitive = a radio group rendered as full-width option rows (`role="radiogroup"`/`radio` + `aria-checked`). Rejected: toggle-button group (breaks at 320 with long labels; visually the same filled button that caused the incident), chips (read as filters), select (hides alternatives). Selected = three redundant signals: filled orange radio + orange border/8% tint + the word "Current"; tap on current = no-op. Applying (~400ms): tapped row spins, the PREVIOUS row keeps full Current until commit, group locked — no frame where zero or two rows claim Current. Applied = a green strip INSIDE the changed axis card (never a floating toast): "Applied — training weights everywhere now resolve as RX · Female." + link "See today's session"; auto-dismiss ~5s; persistent trace = green check + value chip in the axis header. No Save button anywhere. Failure: row reverts, error strip "Couldn't apply. Your level is still Scaled · Female." + Retry. Not-picked axis: warning chip "Not picked" + "No pick yet — per-profile weights on this axis can't be resolved. Pick the cell that's yours." Two axes = two separate cards. 100-char values wrap in rows; ellipsize past 28 chars in header chips/strips. Shared tokens (reuse verbatim in the session sheet): selected = 1px `#E07B35` border + `rgba(224,123,53,.08)` fill + filled radio + "Current"; applied = `rgba(77,183,106,.08)` strip + check icon + the coordinates sentence. (Hex values are the prototype's — map to the theme palette at build time; no hex in code.)

**Records.** The movement card leads with the LATEST record, not the max — the designer self-corrected to our resolution law; a PR marker can coexist ("PR 112, current 106"). "Latest sets your working weight" named on the page. Operations via a kebab (44px) → standard anchored MUI Menu (owner's correction away from a bottom sheet): Edit record / Delete record (red). Edit = the Update-1RM sheet variant: movement locked ("Replacing 180 kg · 22 Apr 2026 · Tested"), value/date/source prefilled, subtitle "Fixes this entry in place. Log a new max with Update 1RM instead"; editing the CURRENT record shows a yellow notice "This is your current 1RM. Saving updates the working weight your training days use". Delete = always a confirm dialog, body split by case — latest-of-many ("…makes 176 kg (6 Dec 2025) your working weight…"), the only one ("…clears your max — training rows set as % of 1RM will ask you to enter it again"), a past one ("Your current 1RM stays 180 kg — only the history and chart change"). After delete: snackbar "Record deleted" + Undo (5s). Empty state: the movement card STAYS in the list — "No 1RM on record — training rows set as % of 1RM will ask for your max" + Add 1RM. Overflow: history collapses to the 5 latest + "Show all N"; the chart draws the line through ALL points but dots/labels only ~7 sampled (first/last always). Benchmarks get the SAME hygiene with best-wins confirmation semantics (deleting the PR names the new PR; edit form varies by result type: time → Minutes/Seconds, AMRAP → Rounds/Reps, else one field). "Exclude from stats" NOT included — matches the tech-lead recommendation (edit + delete only).

## Owner ratifications (recorded as D-9..D-11 in `decisions.md`)

Execution order **Profile → Training Day → Records** · S5 remote-change banner is **client-side** (localStorage last-seen coords) · delete **undo = re-create**.

## Verified cost notes (checked against the tree 2026-07-28)

- `rowViewSchema` already ships the FULL authored `load` grid to the client (`session-detail.schema.ts`) — sheet previews ("16 → 12"), unpicked cells ("M: 43 / F: 30") and range labels need NO new grid plumbing.
- Missing additives (Training Day wave): the resolve coordinates (or the athlete's picks) for the source label; the 1RM base value for "80% of 120"; `exerciseId` on the RESOLVED arm (the unresolved arm has it already). All additive.
- `OneRMRecord.source` exists: `MANUAL / AUTO_INFERRED / TESTED` — the design shows only Tested/Manual; AUTO_INFERRED needs a label at build time.
- `TrendChart` + `buildChartGeometry` already exist on Records — sampling is a refinement, not a new feature.
- The profile page already persists picks through an existing mutation — the Profile wave is UI-only.

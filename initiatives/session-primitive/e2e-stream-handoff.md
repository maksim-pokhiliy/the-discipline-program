# e2e-stream handoff — plan-editor live UI-polish (continue next session)

**Use this as the prompt for a fresh session.** We're mid live UI/UX-polish stream of the **plan editor** (`apps/platform`, `src/modules/plan-detail`) during the **Phase-1 e2e self-test** of the `session-primitive` initiative: the owner (Maksim) hand-builds evil CrossFit workouts in the UI and streams UI defects; I fix them inline. Continue in the same mode.

## Working agreement

- **Live stream:** owner throws a defect/tweak → fix immediately → verify → reply concise. Russian prose, English for code/paths/commits (no en-ru mixing).
- **Deps: just install** when needed — owner overrode the CLAUDE.md "confirm deps" rule for THIS project. `pnpm install`, catalog `catalog:` refs, no gating.
- **Micro-fixes inline; feature-scope → the scope pile** (§Scope below) for ONE later `/feature`. Do NOT do contract+Prisma+gated changes inline.
- **Verify every fix:** `pnpm --filter platform check-types` + targeted `pnpm exec vitest run --project platform <pattern>` + `pnpm exec eslint <files> --max-warnings 0`. Per-package runs are fine without approval; NEVER run the full root suite or any `@repo/api-server` suite (gated, ~10 min, owner-manual).
- **format-lint hook** fires after EVERY edit and reports unused-import/var errors on INTERMEDIATE states (import added in one edit, used in the next). That's noise mid-batch — the FINAL state is what matters; confirm with a real eslint run at the end.
- Patterns: no code comments; one component per file; MUI floating labels everywhere; colors only via theme palette slots (no hex); match existing patterns; don't fix component layout by overriding MUI defaults with "силовые" sx hacks — fix the real cause (owner corrected this twice).

## Key locations

- Schema modal: `axis-editor-modal.tsx` → `axes/container-inspector.tsx` (header + `RepetitionAxisField` + `RestSpecFields` + `IntensityFields`). `create-schema-flow.tsx` is now a thin wrapper over ContainerInspector.
- Row card: `schema-row-card.tsx` (grid cols: lead[drag/checkbox] · ord · body · demo · edit · delete) + `schema-row-card-body.tsx`.
- Group: `row-group-box.tsx` + `row-group-box-head.tsx`; members = `SchemaRowCard` with `timeline={{ord,isFirst,isLast}}` → `row-timeline-marker.tsx` (dot+number+connector in the ord column).
- Number inputs: `number-field.tsx`, `count-or-range-field.tsx`, `step-array-fields.tsx`, `reps-unit-bound-fields.tsx`, `time-cap-fields.tsx`, `cadence-axis-field.tsx`, `interval-axis-field.tsx`, `rest-spec-fields.tsx`, `intensity-fields.tsx`.
- Contracts: `packages/contracts/src/entities/lms/` — `schema/`, `schema-row/`, `composition/`, `_shared/{reps,intensity,cap-spec}.ts`.
- Prototype (Claude Design): unpacked this session to `…/tool-results/proto/plan-editor-hi-fi-v-2/project/` (`axis-editor.jsx` = schema modal incl. IntensityEditor reference, `row-editor.jsx`, `axes.js`). Likely gone in a fresh session — re-fetch the "Plan Editor.html" Claude Design share via DesignSync/WebFetch if needed.

## DONE this session (do NOT redo)

1. **MUI theme small inputs** (`packages/mui/src/theme/components/text-field.ts`): fixed input height (small root `height: 32`) and the floating-label notch — by making the whole small input ONE fontSize on the **root** (`body2`/13px) so input/fieldset/legend inherit it + default label `scale(0.75)`; no scale/legend hacks (per MUI maintainer siriwatknp: don't fight the notch with scale).
2. **reps units**: added `m` + `cal` to `REP_UNITS` (`_shared/reps.ts`) + `UNIT_LABELS` (`reps-unit-bound-fields.tsx`) — closes "10 cal / 400m" (P-6).
3. **select-mode checkbox squish** fixed (auto lead column in select mode; no checkbox sx hack).
4. **Schema modal layout** = prototype: 6-col repetition tile grid, derived-label in BOTH modes + live, repetition-first / title-last order, `count` tile label "Rounds", title placeholder "name this container…". Removed legacy ladder branch in CreateSchemaFlow (unified to ContainerInspector).
5. **Intensity editor RESTORED on schema**: new `intensity-fields.tsx` (RPE / HR zone / effort% / pace) wired in ContainerInspector; `schema.intensity` threaded `SchemaDraft` → `schema-to-draft.ts` → create/update submit. (Field + `createSchemaRequest.intensity` already existed; only the editor UI had been dropped in W4.)
6. **EX RowKindBadge removed** from rows.
7. **Block collapse**: chevron expand/collapse on `BlockCard`/`block-card-head.tsx`, mirroring SessionCard.
8. **Group display rework**: dropped `@mui/lab` Timeline → custom `row-timeline-marker.tsx` (dot+number+connector in the ord column); drag aligned col-1 across non-group / group-header / members; group = ONE atomic ordinal in schema numbering (`schema-row-list-body.tsx` group `+= 1`); group head shows the ord digit (removed icon + "GROUP" word, `row-group-box-head.tsx`); moved row `py` from the grid container → body so the connector is continuous.
9. `@mui/lab@7.0.1-beta.25` installed for the Timeline, **now UNUSED** after the custom rewrite. Material pinned `@mui/material: 7.3.6` (exact) in catalog — bumping to 7.3.11 broke `<Box component={Link}>` types (athlete-card-link), reverted.
10. Catalog seed for the e2e: 14 equipment + 6 labels + 34 exercises loaded via the admin API.

All of the above are green (check-types + targeted vitest + eslint).

## QUEUE — not done (start here)

1. **Inputs must allow clearing (no auto-0).** Root cause: `number-field.tsx:35` `onChange(Number(e.target.value))` → `Number("")===0`. Fix `NumberField` to allow an empty input (hold raw string / emit empty so form validation catches it, not 0). Then **sweep all schema + row modal number inputs**: count-or-range (rounds count), `step-array-fields` (`coerceStepValue`→0), time-cap, cadence (everyMin/rounds), interval (work/off/count), intensity (RPE/effort), rest duration value. None should snap to 0 on clear — validation already handles empties. (Owner just hit this on rounds count in the schema modal.)
2. **rounds chip + schema-card head** (`schema-card-head.tsx`, `schema-card-meta.tsx`):
   - Chip shows `deriveCompositionLabel(composition).kind` ("rounds") — make it show the full label (tag, e.g. "2 ROUNDS"/"2 rounds"), `schema-card-head.tsx:110`.
   - Delete the duplicate 2nd-line text: `SchemaCardMeta` renders `formatCompositionSummary` parts (e.g. "2 rounds") that duplicate the chip — drop the composition-summary parts from the meta line (keep the intensity chips).
   - Don't auto-set the title: `schema-card-head.tsx:113` `formatSchemaHeader(schema)` falls back to a derived label when `header` is null → shows an auto title the coach didn't enter. Show empty/placeholder when header is null.
3. **(mechanical) remove unused `@mui/lab`** — catalog (`pnpm-workspace.yaml`) + `apps/platform/package.json` + `pnpm install`.

## Scope pile — feature-scope, NOT inline (for ONE later `/feature`)

- **B — row-level intensity + rest.** Add `intensity` + `rest` to `schema-row` (contract `schema-row.schema.ts` + Prisma `SchemaRow` + api-server mappers + row-editor UI; reuse `IntensityFields`). **Reverses D-FLOORS** ("intensity schema-only") **+ D-PLAQUE** ("rest schema-only") — owner ratified the reversal: rest/RPE are row qualities, splitting movements into separate schemas to attach them is wrong. Needs reseed + gated api-server suite. Promote the D-FLOORS/D-PLAQUE re-open into `decisions.md`.
- **1RM** — 1RM belongs to the athlete profile; %-loads reference it (athlete builds to a 1RM single, records the weight, then `5×5 @ 75%` computes off it). Phase-3 (`Performed*`/`OneRMRecord` redesign). Domain finding, not now.

## Pointers

- e2e corpus: `initiatives/session-primitive/e2e-evil-corpus.md` (3 evil sessions, boundary probes P-1..P-7, catalog prereqs). Defects stream from the owner building these by hand.
- Board: `initiatives/session-primitive/state.md`. Phase-1 gate = this e2e self-test, then `/initiative-close` → Phase 2.

## First action

Acknowledge briefly, then continue the stream — default to QUEUE #1 (NumberField clear sweep) unless the owner throws a new defect first.

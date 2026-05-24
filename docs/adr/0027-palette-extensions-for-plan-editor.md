# 0027. Palette extensions for plan editor

- **Status:** Accepted
- **Date:** 2026-05-24
- **Deciders:** maksim-pokhiliy (planner), Denys (coach)
- **Tags:** `mui-theme`, `palette`, `plan-editor`, `design-system`

## Context

The Plan Editor redesign (`apps/platform/src/modules/plan-detail/`, layered initiative tracked in `~/discipline-design-bundles/HANDOFF.md`) is the entry point of a wider visual refresh that cascades across all three apps in the monorepo (admin, marketing, platform). The hi-fi prototype provided by Claude Design references a richer set of dark-theme tokens than `packages/mui/src/theme/palette.ts` previously exposed:

- A divider variant at `rgba(255, 255, 255, 0.18)` used for hover-border surfaces on inputs, day summary cards, plus-row affordances, and the new kind-badge border.
- Two additional text tones between the existing `muted` (`0.50`) and `disabled` (`0.38`): `subtle` (`0.42`) for cascade indicators / italic hints / ordinals, and `faint` (`0.28`) for inter-meta `·` bullets in schema-params.
- A nested-surface background at `#232323` for recessed cards inside schemas / EMOM sub-schemas / inset toggle bodies.
- A typed mapping from row-kind discriminators (`ex | rest | foot | load | url | placeholder | ladder`) to canonical colors so `RowKindBadge` and downstream catalog UIs can resolve their tint without per-callsite `if`-chains.

Layer A (`PR #204`, `PR #205`) brought the existing palette to MUI-conformance and added the `TypeText.muted` augmentation. Layer C0.5 (this PR) opens the global redesign and is the right moment to set the public theme surface, because every Layer C step (C1–C13) and every consumer outside Plan Editor will read from these slots.

`CLAUDE.md` forbids raw hex literals outside `packages/mui/src/theme/palette.ts` and forbids per-instance `sx` overrides that duplicate values the theme should own (ADR-0006 §"Decision" line 36). Inline `alpha(theme.palette.primary.main, 0.025)` calls in 7 composites would have shipped a parallel-invention layer that drifts from the canonical theme over time. The semantic-slot approach keeps one editable site per token.

User ratified the full 5-slot extension on 2026-05-23 (`/feature` Stage 1 decision Q3, "All 5 slots — Recommended").

## Decision

We extend the dark theme palette with five new slots in `packages/mui/src/theme/palette.ts`, augmenting `@mui/material/styles` (`Palette`, `PaletteOptions`, `TypeText`, `TypeBackground`) in the same pattern as the existing `TypeText.muted` augmentation:

- **P-01 `palette.dividerStrong: "rgba(255, 255, 255, 0.18)"`** — hover-border state surface; used by `MuiOutlinedInput` hover, day-summary hover, plus-row affordance, kind-badge border.
- **P-02 `palette.text.subtle: "rgba(255, 255, 255, 0.42)"`** — italic hints, cascade indicators, ordinals in composites.
- **P-03 `palette.text.faint: "rgba(255, 255, 255, 0.28)"`** — inter-meta `·` bullets, schema-params separators.
- **P-04 `palette.kind: { ex, rest, foot, load, url, placeholder, ladder }`** — 7-key record. Each value re-uses an existing canonical token (`text.primary` for `ex`, `info.main` for `rest`, `warning.main` for `foot`, `primary.main` for `load`, `text.secondary` for `url / placeholder / ladder`). The five canonical literals are extracted into module-scope constants so the palette has exactly one editable source per color.
- **P-05 `palette.background.recessed: "#232323"`** — nested-surface background for inset content cards inside schemas, EMOM sub-schemas, and toggle-section bodies.

All five slots are reachable from `sx={{ color: 'kind.ex' }}` / `sx={{ bgcolor: 'background.recessed' }}` / `sx={{ borderColor: 'dividerStrong' }}` string-path form. The single exception that uses callback form is `RowKindBadge` (`packages/ui/src/components/row-kind-badge/`), which indexes the palette dynamically (`theme.palette.kind[kind]`) and therefore needs the callback `sx={(theme) => ({ ... })}` style; this is a TypeScript indexing requirement, not a palette-typing limitation.

## Consequences

### Positive

- Composites use semantic tokens instead of inline `alpha(theme.palette.primary.main, x)` literals. Six existing prototype CSS classes (`.day-summary:hover`, `.plus-row`, `.kind-tile:hover`, `.input:hover`, etc.) collapse to a single `borderColor: 'dividerStrong'` reference.
- The `palette.kind` map encodes the canonical RowKind → color mapping in one auditable place. Renaming a kind or recoloring an archetype is a single-file edit; no consumer grep required.
- T01 verification probe (recorded in `.feature-dev/1779589540/research.md` and `.feature-dev/1779589540/feature-request.md`) confirmed that augmenting `TypeText` / `TypeBackground` / `Palette` propagates through the `mui-augmentations.d.ts` chain to consumers, and that MUI's `sx` color-resolver picks up the nested `kind.<key>` path. No `as` cast or `// @ts-expect-error` is needed at any callsite.
- One-way-door risk on the public theme API is acceptable: the team owns all three consuming apps, and Layer A/B already established the augmentation pattern.

### Negative

- The public theme surface widens. Every future palette change is now a consumer-facing API change. `Palette.kind` is particularly load-bearing — adding a kind requires updating the discriminator, the map, the `RowKindBadge` `RowKind` union, and Storybook coverage in lockstep.
- T05 (Card `variant="accent-dashed"` augmentation) revealed that Card variant typing in MUI 7.3.6 chains through `PaperPropsVariantOverrides`, not `CardPropsVariantOverrides` (the latter is marked unused in MUI's own type definitions). This is mechanical, fixed in T05 by augmenting `@mui/material/Paper` instead. The side effect is that `<Paper variant="accent-dashed">` is also a valid JSX element in our codebase; this is additive widening only, no breaking change, but worth knowing if a future audit lists Paper variants.

### Neutral

- The 5 canonical color literals (`PRIMARY_MAIN`, `INFO_MAIN`, `WARNING_MAIN`, `TEXT_PRIMARY`, `TEXT_SECONDARY`) are extracted to module-scope constants inside `palette.ts`. This pattern matches the existing house style (`CHIP_HEIGHT`, `TINT_PRIMARY` in `chip.ts`). Future literal edits go through these constants.
- The `kind` record uses string values (not enum-keyed primary/info/etc. references) because MUI's palette tree is built before the augmentation resolves, so the cleanest path is direct string assignment using the extracted constants. Read time, write time, and edit time are all O(1) lookups.
- `RowKindBadge` is the only `palette.kind` consumer that needs callback `sx`. All other consumers (background / text / divider) work string-path.

## Alternatives considered

- **Inline `alpha()` and hex per-composite.** Rejected. Each of the 7 composites in this PR would have inlined the values; the 6 prototype CSS classes that share `dividerStrong` would have diverged within a quarter; `palette.kind` would have become a `Record<RowKind, string>` const duplicated in 2-3 modules. Manifesto §2.15 ("reuse before invent") + `CLAUDE.md` hex-outside-palette ban make this a non-starter.
- **Per-screen ad-hoc palette aliases (CSS variables, screen-scoped theme).** Rejected. The redesign cascades all three apps; per-screen tokens fragment the design system and undo the Layer A/B consolidation work.
- **Defer the slots to the screen layer (C2–C13).** Rejected. Composites land in this PR and need typed access at compile time; deferring forces a second migration when each composite arrives, with the same hex-literal risk in between.
- **Add only `palette.kind` and inline the divider / text / background changes.** Rejected. `dividerStrong` is already used in 4+ MUI overrides (text-field hover, plus the future Plan Editor screen-CSS replacement); semantic naming wins at the use-site density we have.

## References

- [ADR-0006](./0006-mui-as-design-system.md) — MUI as design system; the parent decision constraining how we extend the theme.
- `~/discipline-design-bundles/HANDOFF.md` — Plan Editor redesign initiative; layer model, ratified decisions, post-merge updates.
- `.feature-dev/1779589540/feature-request.md` — full ratified scope of Layer C0.5 (theme + 7 composites bundle).
- `.feature-dev/1779589540/research.md` — codebase analysis, augmentation precedent, R-4 probe outcomes per slot.
- `.feature-dev/1779589540/design.md` — RFC (§5.3.1 palette, §5.5 R-4 fallback tree, §10 ADR stub).
- PR — `feat/mui-plan-editor-foundation` (this branch).

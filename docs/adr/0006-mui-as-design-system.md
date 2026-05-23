# 0006. MUI as the design system

- **Status:** Accepted
- **Date:** 2026-04-10
- **Tags:** `ui`, `design-system`, `frontend`

## Context

The monorepo ships three Next.js apps with different UX requirements:

- **Admin** — desktop-first back-office. Dense forms, data tables, modals, navigation sidebar, file uploads. Productivity-oriented, looks more like an internal tool than a marketing site.
- **Platform** — mobile-first PWA for coaches and athletes. Drag-and-drop, date pickers, calendars, bottom navigation, drawers, PWA-style interactions.
- **Marketing** — public landing pages. Custom hero sections, rich typography, image-heavy, SEO-critical, brand-forward visuals.

All three consume a shared component library (`@repo/ui`) built on top of a shared design foundation (`@repo/mui`). The UI foundation must:

1. **Provide a complete component inventory.** Buttons, inputs, modals, tabs, tables, chips, snackbars, date pickers, data grids — everything a production coaching platform needs, without a six-month buildout of primitives.
2. **Support heavy customization through a theme.** Brand colors, typography scale, spacing, component variants, all centralized. Per-instance `sx` overrides are an anti-pattern per `CLAUDE.md`.
3. **Work with Next.js App Router and server components.** SSR-safe, no hydration mismatches, no FOUC.
4. **Have strong TypeScript support.** Prop types, theme augmentation, module declaration merging for custom variants.
5. **Ship date pickers with timezone awareness.** Platform-side scheduling requires a calendar picker that understands user timezones.
6. **Support drag-and-drop composition** (for coach-side workout ordering). This is an integration concern, not a core UI concern, but the DnD library must not conflict with the UI framework.

## Decision

We use **MUI** (`@mui/material` 7.3.6, `@mui/icons-material` 7.3.6, `@mui/x-date-pickers` 8.6.1, `@mui/material-nextjs` 7.3.6) as the design system across all three apps.

The shared `@repo/mui` package owns:

- The theme configuration (`packages/mui/src/theme/`), including palette, typography, spacing, and component overrides.
- The `NextProvider` wrapper (`AppRouterCacheProvider` + `ThemeProvider` + `CssBaseline` + `LocalizationProvider` for dayjs).
- Custom fonts via `next/font`.

The shared `@repo/ui` package owns higher-level compositions built on MUI primitives: `DataTable`, `FormView`, `BaseModal`, `FormModal`, `ConfirmationModal`, `StatsCard`, `StatusChip`, `RichTextEditor`, and so on. `@repo/ui` depends on `@repo/mui` and re-exports the provider pattern.

Per-instance styling uses the `sx` prop with theme tokens (`p: 2`, `bgcolor: "background.paper"`, `color: "text.secondary"`). Raw pixel values, hex colors, and custom transitions are forbidden by `CLAUDE.md` anti-patterns. Variants and sizes that are needed more than twice become theme-level overrides, not per-call `sx`.

## Consequences

**Positive:**

- Complete component inventory from day one. Data tables, date pickers, file uploads, and modals exist without a custom buildout. Onboarding is fast: "it's MUI" tells a new engineer where to look for docs.
- `@mui/x-date-pickers` with `AdapterDayjs` gives us timezone-aware date inputs that match the dayjs usage elsewhere in the stack.
- Strong TypeScript support including theme augmentation (`packages/ui/src/mui-augmentations.d.ts`) for custom typography variants and palette keys.
- `@mui/material-nextjs` provides `AppRouterCacheProvider` with explicit CSS layer support, avoiding the hydration and cascade bugs that plague Emotion + RSC without it.
- The global theme means a brand change is one file, not thirty. Button color, focus ring, typography scale — all centralized.

**Negative:**

- **Bundle size.** MUI is heavy. `@mui/material` alone is ~300 KB gzipped before tree-shaking. `@mui/icons-material` is much worse if imported wrong (`import { Foo } from "@mui/icons-material"` bundles the entire icon set; the canonical form is `import Foo from "@mui/icons-material/Foo"`). Tracked in the audit, section 10 (bundle budgets).
- **Opinionated design language.** MUI looks like Material Design by default. Marketing pages with brand-specific visuals require fighting the defaults — the `marketing` app uses MUI components wrapped in custom styling to get away from the Material look, which is more work than a headless library would have been for that specific app.
- **Two icon libraries in the wild.** `apps/marketing` uses `lucide-react` alongside `@mui/icons-material`. The lucide set was imported for the brand-forward marketing visuals; MUI icons cover admin and platform. Inconsistency tracked in the audit, section 8.
- **`@mui/material-nextjs/v15-appRouter`** import path — we are on Next.js 16, and the path has not been updated. Either MUI has not shipped a v16 path yet, or the upgrade was missed. Tracked in the audit, section 1.
- **Emotion-based styling** means Emotion is on every critical render path. Works, but it is another moving piece.
- **Storybook is scoped to MUI, not `@repo/ui`.** 27 stories exist, all showcasing raw MUI components, none documenting the shared `@repo/ui` compositions. Shared components have no visual reference. Tracked in the audit, section 8.

**Neutral:**

- MUI's `sx` prop is the officially sanctioned styling escape hatch. `CLAUDE.md` has extensive anti-patterns constraining its use (no raw pixels, no hex colors, no transitions-as-strings, no layout props in `sx` that belong as Stack props). These constraints are codified precisely because `sx` is powerful enough to be abused.
- `styled()` from Emotion is used sparingly, mostly in `@repo/ui` for complex components like `RichTextEditor`. Per-component styled wrappers are fine; per-instance ones are not.

## Alternatives considered

**shadcn/ui + Tailwind.** The 2024–2026 trend. Headless primitives copied into the repo, styled with Tailwind, owned by the consumer. Pros: minimal bundle, maximum control, no vendor lock-in. Cons: you are building your data table, your date picker, your modal stack, your file upload — from scratch. For a coaching platform that has to ship an LMS, CMS, and billing layer in parallel, that is a year of primitive work we do not have budget for. shadcn is a great choice for a team that wants to own its UI surface end to end. We do not. Rejected.

**Mantine.** Comparable scope to MUI, lighter bundle, cleaner API in some places. Genuine alternative. Rejected because MUI's data-picker and data-table ecosystem is stronger, its theme augmentation story is more mature, and the documentation is deeper — and because the project had already landed on MUI before this ADR was written, so rewriting would have cost more than the incremental improvement justified. Worth remembering if we ever migrate.

**Chakra UI.** Solid, lighter than MUI, good accessibility defaults. Rejected for weaker data-grid and date-picker stories and for a smaller ecosystem of community components.

**Ant Design.** Enterprise-flavored, very complete. Rejected because the design language is strongly opinionated toward enterprise dashboards (Chinese enterprise dashboards specifically) and does not adapt well to a brand-forward marketing site sharing the same design tokens.

**Radix UI primitives + hand-built components.** Headless, unstyled, accessible. Same trade-off as shadcn — maximum control, maximum work. Rejected for the same reason.

**Park UI / Kuma UI / other 2024+ entrants.** Too new, ecosystem too shallow, unproven at production scale. Not serious contenders yet.

**Custom component library built on Tailwind.** Would require designer-developer handoff process, design tokens, component variance management — a full design system buildout. Rejected as disproportionate for current team size.

## References

- `packages/mui/src/theme/` — theme configuration.
- `packages/ui/src/` — shared component library.
- `packages/ui/src/mui-augmentations.d.ts` — theme type augmentation.
- `apps/storybook/` — MUI component catalog (gap: should also document `@repo/ui`; see ADR 0022 for the deferral).
- `CLAUDE.md` anti-patterns section — `sx` constraints.
- ADR 0022 — monorepo discipline (Storybook coverage trigger).
- ADR 0024 — frontend-performance deferred decisions (bundle/perf gaps).

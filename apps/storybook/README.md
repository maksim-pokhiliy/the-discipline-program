# storybook

Component development environment for The Discipline Program. Hosts stories that exercise raw MUI components against the project theme tokens (colors, typography, spacing) and the cross-app primitives from `@repo/ui`. Not deployed to end users — local + preview only.

## Where it runs

- **Port:** `6006`
- **Dev:** `pnpm --filter storybook dev`
- **Build (static export):** `pnpm --filter storybook build` — emits `storybook-static/`.

## Environment

No app-level `.env.local`. Storybook does not boot the apps' env validators; it consumes pre-built theme tokens from `@repo/mui` and components from `@repo/ui` / `@repo/contracts` only. The `SKIP_ENV_VALIDATION=1` escape hatch applies if a dependent package starts pulling env at import time.

## Layout

```
.storybook/
  main.ts               Storybook config (framework: @storybook/nextjs-vite)
  preview.tsx           Decorators (theme provider, query client wrapper)
  preview-head.html     Font preloads (Nunito Sans woff2)
src/
  story-layout.tsx      Shared <StoryLayout /> wrapper for stories
  data-display/         Stories for data-display primitives
  edit-session/         Stories for the workout-edit surface
  feedback/             Stories for feedback components (snackbars, dialogs)
  inputs/               Stories for inputs (forms, selects, chips)
  lms/                  Stories for LMS-shaped components
  navigation/           Stories for navigation primitives
  plan-editor/          Stories for the plan-editor surface
  surfaces/             Stories for surface primitives (cards, sheets)
  theme/                Stories that exercise theme tokens directly
```

Story files follow the `*.stories.@(ts|tsx)` glob (see `.storybook/main.ts`).

## Scope

Per [ADR 0022 — monorepo discipline decisions](../../docs/adr/0022-monorepo-discipline-decisions.md), Storybook is positioned as the **MUI theme catalog**: stories test theme tokens and surface primitives, while `@repo/ui` components are tested through their app-level usage. Adding `@repo/ui`-only stories is welcome but not a hygiene gate.

## Conventions

- Stories live next to the surface they exercise (`src/<surface>/<component>.stories.tsx`).
- One component per story file — match the rest of the monorepo.
- No auth, no DB, no HTTP. If a component needs server state, mock the React Query response in the story.

## Related ADRs

- [ADR 0022 — monorepo discipline decisions](../../docs/adr/0022-monorepo-discipline-decisions.md) (Storybook scope rationale)

See the root [README](../../README.md) for the full architecture overview.

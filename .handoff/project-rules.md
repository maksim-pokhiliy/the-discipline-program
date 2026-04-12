# The Discipline Program — Project-Specific Rules

Rules specific to this project's codebase, stack, and conventions. General audit rules are in `shared-audit-rules.md`.

---

## Next.js 16 proxy convention

Next.js 16 uses `src/proxy.ts` (convention-based) instead of `middleware.ts`. No import needed — auto-discovered by the framework.

## No cross-module imports

Never import from one app module into another. Extract to shared lib first. This is a monorepo with strict bounded contexts.

## No overengineering shared components

When extending shared components, make minimal changes. Don't add alignment/layout props when children can handle their own layout.

## No stub actions

Never add UI actions that duplicate existing behavior or have no real functionality.

## No hidden interactions

Never use double-click, long-press, or other non-discoverable UX patterns for primary actions.

## Pre-commit command

Always run `task lint && task format` before committing, not `pnpm lint`/`pnpm format` separately.

## Storybook-first override flow

When building design system primitives: disable existing override → add story → review stock MUI → then override only what's needed.

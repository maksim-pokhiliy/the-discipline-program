# `@repo/ui`

Shared React components used across admin, marketing, and platform. Built on `@repo/mui` (theme) and `@repo/contracts` (typed props for entity-shaped components). Does **not** depend on any app — apps depend on it.

## Public API

```ts
import {} from /* shared components */ "@repo/ui";
import {} from /* error pages */ "@repo/ui/error-pages";
import { BrandIcon } from "@repo/ui/brand-icon";
```

The `/error-pages` subpath isolates the `not-found` / `error` / `global-error` page shells so apps re-export them without pulling in the full UI barrel for a 404 route.

## Layout

```
src/
  index.ts                    Barrel — primitives, surfaces, inputs, data-display
  brand-icon.tsx              Standalone brand mark (kept off the barrel for icon-only consumers)
  components/error-pages/     not-found / error / global-error shells
  components/<group>/         Primitives grouped by surface kind
```

## Conventions

- One component per file (memory: one component per file).
- Reuse before invent — before adding a new primitive, search the barrel + the storybook source. Targets called out in memory: `Stack spacing={4}`, `ChipTab`, admin filter primitives.
- Owner columns render `UserChip` (name + avatar), never raw cuid (memory: owner column avatar).
- Rich-text content goes through `RichTextViewer`, which sanitizes via `isomorphic-dompurify` (see SEC-003 in the audit fix log).
- Discriminated payload UIs render typed forms per discriminator — no JSON editor in the UI (memory: no JSON editor in UI).

## Related ADRs

- [ADR 0006 — MUI as design system](../../docs/adr/0006-mui-as-design-system.md)

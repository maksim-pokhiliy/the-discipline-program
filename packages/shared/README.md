# `@repo/shared`

Cross-cutting primitives that don't fit a more specific package — navigation tables, role/route enums, generic types, and small utilities that the apps and other packages all consume. Zero runtime dependencies on framework code; safe to import from server, client, and edge.

## Public API

```ts
import {} from /* navigation, types, constants */ "@repo/shared";
```

Single entry point. The package stays small on purpose — anything domain-shaped belongs in `@repo/contracts`, anything UI-shaped belongs in `@repo/ui`. `@repo/shared` is the catch-all for what's neither.

## Layout

```
src/
  index.ts        Barrel — re-exports everything below
  <group>/        One subdirectory per concern (navigation, types, constants)
```

## Conventions

- No framework imports (no `next`, no `react`, no `@mui/*`). Pure TypeScript only.
- No DB types — those flow from `@repo/contracts`.
- Tests with `vitest`; no DOM needed.

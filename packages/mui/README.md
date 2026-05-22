# `@repo/mui`

Shared MUI 7 theme + provider plumbing for the apps. Owns the Barlow + Barlow Condensed font setup, the project's design tokens, and the `<MuiProvider>` that wires emotion cache + theme + Next.js App Router compatibility.

## Public API

```ts
import {} from /* theme, provider, primitives */ "@repo/mui";
import {} from /* font helpers */ "@repo/mui/fonts";
```

The `/fonts` entry exports the next/font loaders so apps can preload the same Barlow + Barlow Condensed families without duplicating the configuration.

## Layout

```
src/
  index.ts          Barrel — theme tokens + <MuiProvider>
  fonts/index.ts    Barlow + Barlow Condensed next/font loaders + CSS variable bindings
  <theme files>     Palette, typography, component overrides
```

## Conventions

- One theme. All apps consume the same palette + typography ramp; per-app overrides happen at the page level, not by forking the theme.

## Related ADRs

- [ADR 0006 — MUI as design system](../../docs/adr/0006-mui-as-design-system.md)

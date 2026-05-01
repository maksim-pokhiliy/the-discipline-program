# `@repo/typescript-config`

Shared TypeScript base configurations. Pure config — no runtime code.

## Usage

```jsonc
// tsconfig.json
{
  "extends": "@repo/typescript-config/base.json",
}
```

Specific presets (Next.js, React library, etc.) layer on top of `base.json` per consumer. Update by editing the JSON files in this package; consumers pick up the change on next type-check.

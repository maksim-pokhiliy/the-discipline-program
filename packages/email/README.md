# `@repo/email`

Transactional email primitives — provider port + react-email templates. Currently uses Resend as the concrete implementation, but the port lets the apps stay decoupled.

## Public API

```ts
import {} from /* shared helpers */ "@repo/email";
import {} from /* port + adapter */ "@repo/email/port";
import {} from /* templates */ "@repo/email/templates";
```

The `/port` entry exposes the `EmailSender` interface + Resend adapter; templates render via `@react-email/render` to HTML at send time.

## Layout

```
src/
  index.ts        Barrel — high-level send helpers
  port.ts         EmailSender port + Resend adapter
  templates/      React-email templates (one component per file)
```

## Conventions

- Templates are React components (`@react-email/components`); they stay framework-only and never read env directly. Subjects + recipients flow in as props.
- The port boundary keeps Resend swappable. New transactional flows add a method to the port + a template file, not a direct Resend call.
- `sideEffects: false` — tree-shakeable.

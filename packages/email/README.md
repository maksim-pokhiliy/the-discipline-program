# `@repo/email`

Transactional email primitives — provider port + Resend adapter + react-email templates. The port lets consumers stay decoupled from the concrete vendor.

## Public API

```ts
import {} from /* port + Resend factory + templates */ "@repo/email";
import {} from /* port types only */ "@repo/email/port";
import {} from /* templates */ "@repo/email/templates";
```

The root barrel re-exports the `EmailPort` interface (from `port.ts`), the `createResendEmailService` factory (from `client.ts`), and the templates. The `/port` subpath is the type-only entry for consumers that want to depend on the interface without pulling the Resend SDK into their import graph.

## Layout

```
src/
  index.ts        Barrel — re-exports port types, Resend client factory, templates
  port.ts         EmailPort interface + SendEmailInput / SendEmailResult / EmailAddress types (zero vendor SDK imports)
  client.ts       createResendEmailService(config) — the only file that imports the Resend SDK
  templates/      React-email templates (one component per file)
```

## Conventions

- Templates are React components (`@react-email/components`); they stay framework-only and never read env directly. Subjects + recipients flow in as props.
- The port boundary keeps Resend swappable. New transactional flows add a method to the port + a template file, not a direct Resend call.
- `sideEffects: false` — tree-shakeable.

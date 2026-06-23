# `@repo/email`

Transactional email design system — design tokens + shared chrome components + declarative template descriptors + a generic render path + a provider port and Resend adapter. The port lets consumers stay decoupled from the concrete vendor; the design system keeps every template on one brand.

## Public API

```ts
import {} from /* render API + templates + theme + components + port + Resend factory */ "@repo/email";
import {} from /* port types only */ "@repo/email/port";
import {} from /* design tokens + style objects */ "@repo/email/theme";
import {} from /* shared chrome + leaf components */ "@repo/email/components";
import {} from /* template descriptors */ "@repo/email/templates";
```

The root barrel re-exports the render API (`renderEmail`, `defineEmail`, `EmailTemplate`, `RenderedEmail`), the template descriptors, the `theme` tokens, the shared components, the `EmailPort` interface (from `port.ts`), and the `createResendEmailService` factory (from `client.ts`). The `/port` subpath is the type-only entry for consumers that want the interface without pulling the Resend SDK into their import graph.

## Layout

```
src/
  theme.ts        Single design-token source (the ONLY file with hex literals) + reusable style objects + the greet() helper
  components/      Shared chrome + leaf components, one per file:
    email-layout.tsx   Html/Head/Preview/Body/Container + branded header (accent bar + wordmark) + footer — owns ALL chrome
    email-button.tsx   Branded solid CTA
    link-fallback.tsx  "Or copy this link:" + the raw URL (survives plain-text conversion)
    info-row.tsx       label:value line
    index.ts           Sub-barrel for the components
  render.tsx      EmailTemplate<P> + RenderedEmail + defineEmail + renderEmail (wraps Body in EmailLayout, renders html + text)
  templates/      One descriptor per file (defineEmail): invitation, password-reset, lead-notification
    index.ts           Barrel of the descriptors + their prop types
  port.ts         EmailPort interface + SendEmailInput / SendEmailResult / EmailAddress types (zero vendor SDK imports)
  client.ts       createResendEmailService(config) — the only file that imports the Resend SDK
emails/           react-email preview entries (one default-exported component per template) — `pnpm --filter @repo/email preview`
```

## Rendering an email

```ts
import { invitationEmail, renderEmail } from "@repo/email";

const { subject, html, text } = await renderEmail(invitationEmail, {
  inviteUrl,
  recipientName,
  expiresInHours,
});
```

`renderEmail(descriptor, props)` computes the subject, wraps the descriptor's `Body(props)` in `EmailLayout` (using `descriptor.preview(props)`), and renders the HTML and plain-text variants in parallel. The subject lives in the descriptor — it is the single source for subject wording.

## Adding a template

1. Create `templates/<name>.tsx` exporting a prop type and a descriptor built with `defineEmail`:

```tsx
import { Heading, Section, Text } from "@react-email/components";

import { EmailButton } from "../components/email-button";
import { defineEmail } from "../render";
import { greet, theme } from "../theme";

export type WelcomeEmailProps = {
  ctaUrl: string;
  recipientName?: string | null;
};

export const welcomeEmail = defineEmail<WelcomeEmailProps>({
  subject: () => "Welcome aboard",
  preview: () => "Welcome aboard — here's how to start",
  Body: ({ ctaUrl, recipientName }) => (
    <Section>
      <Heading style={theme.heading}>Welcome aboard</Heading>
      <Text style={theme.text}>{greet(recipientName)}</Text>
      <EmailButton href={ctaUrl}>Get started</EmailButton>
    </Section>
  ),
});
```

2. Add a line to `templates/index.ts`: `export * from "./<name>";`
3. (Optional) Add `emails/<name>.tsx` — a default-exported preview component rendering the descriptor's `Body` inside `EmailLayout` with example props, so `pnpm --filter @repo/email preview` shows it.

The descriptor renders inside `EmailLayout`, so it never declares chrome (`Html/Head/Body/Container/header/footer`). Compose content from the shared components and the `theme` style objects.

## Conventions

- `theme.ts` is the only file with hex literals. Every color, radius, spacing, and font flows from its tokens and exported style objects — no inline hex anywhere else.
- `EmailLayout` owns all chrome. Templates render only their content `Section`.
- The port boundary keeps Resend swappable. Resend is imported only in `client.ts`; consumers depend on the `EmailPort` interface.
- One component per `.tsx`. Subjects + recipients flow in as props; components never read env directly.
- `sideEffects: false` — tree-shakeable.

```

```

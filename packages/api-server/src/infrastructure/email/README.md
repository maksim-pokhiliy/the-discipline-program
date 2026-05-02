# Email port

Transactional email delivery. Used for system-generated messages (password reset, email verification, welcome, payment receipts, coach-athlete notifications).

## Why a port?

Email vendors are commoditized and interchangeable at the "send a single transactional message" level. Binding the codebase directly to one vendor's SDK (as `@vercel/blob` was bound before 1.4.A) creates needless switching cost. The port fixes the shape we depend on; the adapter encapsulates the vendor.

## Shape

`EmailPort.send(input)` accepts `from`, `to` (single address or array), `subject`, `html`, optional `text` fallback, optional `replyTo`. Returns `{ id }` — the vendor-assigned message ID, useful for webhook correlation (bounces, complaints, delivery receipts).

The shape is the largest common denominator across Resend / Postmark / Amazon SES / Mailgun / Sendgrid. All of them accept this exact input structure and return an opaque message ID.

## Vendor candidates

| Vendor   | Model            | Cost (10k/mo) | Webhook events                          | Notes                                                                  |
| -------- | ---------------- | ------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| Resend   | Modern, DX-first | ~$20          | delivered / bounce / complaint / opened | Node SDK is tiny; React Email integration first-class; Vercel-adjacent |
| Postmark | Boring, reliable | ~$15          | delivered / bounce / complaint / opened | Best inbox reputation for transactional; strict on marketing content   |
| SES      | Raw infra        | ~$1           | via SNS: delivery / bounce / complaint  | Cheapest at scale; more setup (domain DKIM, SNS wiring); no DX layer   |
| Mailgun  | Middle ground    | ~$15          | delivered / failed / opened             | EU region option; fine API but less actively invested in recently      |

Live: **Resend** via `@repo/email/createResendEmailService`. React Email templates line up with our Next.js 16 stack, the SDK is a 2-liner, and the pricing tier makes sense for our scale. Migration to Postmark or SES is purely a swap of the adapter — no endpoint or domain-layer code changes.

## Open questions (deferred until vendor is chosen)

- **Template rendering.** Do we render HTML in-process (e.g. React Email → string) and pass it as `html`, or do we use the vendor's template engine and pass a template ID + merge vars? Current port shape assumes in-process rendering. If we go with vendor templates, `EmailPort.send` will need a discriminated union (`{ html } | { templateId, mergeVars }`) — this is a breaking change to the shape, but only affects the adapter layer until we have a domain consumer.
- **Bulk / batch send.** Mass marketing blasts are out of scope for transactional (that's a CRM concern, not this port). If we ever need 1k+ messages in one call, add a `sendBatch` method to the port. Until then, the single-message shape stays.
- **Idempotency keys.** We may need idempotency for webhook-driven sends (e.g. Stripe `invoice.paid` → receipt email). Not in the port yet because the webhook-handling layer isn't built. Will add as an optional `idempotencyKey?: string` on `SendEmailInput` when needed — non-breaking.
- **Reply-to threading.** Currently `replyTo` is a single address. Postmark supports multiple reply-to addresses; Resend does not. Default to single until proven insufficient.

## Adapter placement

When vendor is chosen:

1. `infrastructure/email/resend-adapter.ts` (or equivalent) — the ONLY file in the repo that imports the vendor SDK.
2. Register env var in `packages/env/email.ts` if not present.
3. Update `infrastructure/email/index.ts` to re-export the adapter factory and expose `defaultEmail = createResendAdapter()` as a module-level singleton, following the `storage/index.ts` pattern.
4. Consumers inject via factory-DI: `createXxxAdminApi({ email })` — mirroring `createStorageUploadAdminApi(storage)` from 1.4.A / 1.4.D.

## Non-goals

- **Marketing / newsletter sends.** Different product, different tool (Mailchimp / Customer.io / Loops). Not this port.
- **Template authoring UI.** React Email lives in the marketing app if chosen; not an api-server concern.
- **Email parsing / inbound.** Contact form inbound is handled by a different mechanism (`endpoints/cms/contact/inbound.ts` posts to DB directly). If we ever need inbound parsing (e.g. "reply to this notification to add a comment"), that's a separate `InboundEmailPort`, not this one.

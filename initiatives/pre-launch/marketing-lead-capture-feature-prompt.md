# pre-launch item #7 — Marketing "buy a plan" → lead-capture + head-coach email-notify — `/feature` (full) prompt

**For the executor session.** A cross-layer vertical slice: a visitor on the marketing site clicks "get this plan" on a program, a short **lead form** opens (the chosen program carried **under the hood**), and submitting it creates a **durable lead** AND **emails the head coach**. This is **pre-launch scope item #7** (`docs/roadmap.md`, Block 1).

**NO checkout / payment.** Billing is post-launch (it triggers on a second paying coach); this slice keeps the marketing channel open without a paywall — the roadmap's operating model: _"a visitor who clicks 'buy a plan' gets a short contact form (the plan is already chosen, carried under the hood); it notifies the head coach, who reaches out and invites by email. No checkout until billing lands."_

Wrap via **`/feature` (full)** — it spans a contract schema + an api-server inbound service + a new email template + a public route + a marketing hook/api-client + marketing UI across two consumers + a gated endpoint test. It is **heavy REUSE** (the contact-submission stack and the Resend email package already exist), so it may de-escalate to `small` at Gate A if it proves trivial — but the new email template, the head-coach lookup, and the gated api-server test argue for full.

**This is mostly WIRING + one new email path on top of existing infra — there is NO Prisma change.**

---

## 0. Two SSOTs — visual language vs domain data (governs the whole build)

- **The existing marketing visual language is the SSOT for the VISUAL** — `BaseModal` (`@repo/ui`), `ContentSection`, the `product-modal` / `contact-form` field idiom (MUI `TextField` with floating labels, `react-hook-form` + `zodResolver`, the success-state pattern). Build the lead form **native** in that idiom (MUI 7 + `@repo/ui` + theme tokens; **NO hex, NO transplanted HTML/CSS** in the app UI). **No Claude Design prototype is assumed** for this small form — reproduce the established marketing look. _(If the owner supplies a Design link at kickoff, follow it; otherwise the marketing idiom is the gate.)_
- **The contracts + this prompt's decisions are the SSOT for the DOMAIN & DATA** — which fields exist, which are required, what the email contains, who receives it.
- **Conflict rule:** where the visual idiom under-covers a domain state, extend the idiom in the same language — never drop a domain rule (e.g. "contact is required") to match a mock. The email-notify is best-effort and must NEVER block or fail the submission.

**Exception — the email template is NOT app UI.** A React Email template (`@react-email/components`) uses **inline styles incl. hex** (mail clients can't read the MUI theme). The `no-hex-outside-theme` rule does NOT apply to `packages/email/src/templates/*`. Mirror `invitation.tsx` exactly for style approach.

---

## 1. What this slice is

Today: on the storefront/home a `ProductCard` opens a `ProductModal` with a CTA. In `storefront/sections/grid` that CTA (`onGetStarted`) does `router.push('/contact?program=<slug>')` — a redirect to the **generic 4-field /contact page** (name **required**, contact required, program **visible select**, message **required**); in `home/sections/storefront-programs-preview` the CTA is **not wired at all** (falls back to `onClose`). Neither path emails anyone.

After this slice: the CTA opens an **in-place lead form** (a `BaseModal`) carrying the chosen program **under the hood** (no visible program picker), with the lead field rules (**name optional · contact required · message optional**). Submitting creates a durable lead row **and** fires a best-effort email to the head coach. Both consumers (storefront grid + home preview) use the same flow. The generic `/contact` page is **left untouched**.

---

## 2. Read FIRST — verbatim anchors (quoted from current `main`)

### 2.1 The model already IS a lead model — REUSE it, NO Prisma change

```
// prisma  model MarketingContactSubmission (schema.prisma ~459)
{ id, name String?, contact String?, program String?, message String @db.Text,
  status ContactSubmissionStatus @default(NEW),  // NEW | IN_PROGRESS | REPLIED | CLOSED
  notes String?, createdAt, updatedAt, deletedAt }
```

`program` is **exactly** "the chosen plan carried under the hood". `status` is a ready-made lead pipeline (admin `contacts` CRUD already drives it). `name`/`contact`/`program` are already nullable; `message` is `NOT NULL` → write `message ?? ""` for the optional-message case. **No schema migration is needed; if you believe one is, STOP and flag it — the design says reuse.**

### 2.2 The existing contact contract — what to MIRROR, and where lead DIVERGES

```
// contracts/cms/contact/contact.schema.ts
createContactSubmissionSchema = z.object({
  name:    string min(1) max(MAX_NAME_LENGTH)    .transform(stripHtmlAndControlChars),  // REQUIRED
  contact: string min(1) max(MAX_CONTACT_LENGTH) .transform(stripHtmlAndControlChars),  // REQUIRED
  program: string max(MAX_PROGRAM_LENGTH).transform(stripHtmlAndControlChars).optional(),
  message: string min(1) max(MAX_MESSAGE_LENGTH) .transform(stripHtmlAndControlChars),  // REQUIRED
})
// contact-api.schema.ts: createContactSubmissionResponseSchema = { success: boolean, message: string }
// contact.constants.ts: MAX_{NAME,CONTACT,PROGRAM,MESSAGE}_LENGTH = 100/100/100/2000
// barrel: contracts/cms/contact/index.ts re-exports schema/types/constants/api-schema/api-types
```

`stripHtmlAndControlChars` (NFKC normalize + strip `<script>/<style>/tags` + control/format chars) is the XSS guard — **reuse it on every lead text field** via the same `.transform`.

**Lead field rules differ → a SEPARATE schema (do NOT mutate the contact schema, it would weaken the generic /contact form):**

- `name` — **optional** (lead) vs required (contact)
- `contact` — **required** (lead) — same
- `message` — **optional** (lead) vs required (contact)
- `program` — **required** (lead, the chosen plan slug) vs optional (contact)

### 2.3 The inbound service + public route to MIRROR — and the email GAP

```
// api-server endpoints/cms/contact/inbound.ts
cmsContactInboundApi.createSubmission(data) =>
  prisma.marketingContactSubmission.create({ name, contact, message, ...(program!==undefined && {program}) })
  -> mapToContact(submission)     // NO email is sent — THIS is the new piece for leads
// mapper: mappers/cms/contact.mapper.ts (mapToContact) + mappers/cms/index.ts barrel

// marketing app/api/public/contact/route.ts
POST = withPublicRoute( withRateLimit( createPostHandler(handler, reqSchema, resSchema), RATE_LIMIT_TIER.PUBLIC ) )
```

### 2.4 The marketing client to MIRROR

```
// apps/marketing/src/lib/hooks/use-contact.ts
useSubmitContact = () => useMutation({ mutationFn: (data) => api.contact.submit(data) })
// apps/marketing/src/lib/api/endpoints/contact.ts
createContactAPI = (client) => ({ submit: (data) => client.request("/api/public/contact", "POST", data) })
// barrels to wire: lib/api/index.ts, lib/api/endpoints/index.ts, lib/hooks/index.ts
```

### 2.5 The email package + the send pattern to MIRROR (best-effort, logged-not-thrown)

```
// @repo/email barrel: export * from client | port | templates
// packages/email/src/client.ts: createResendEmailService({apiKey, defaultFrom, defaultReplyTo?}) : EmailPort  (Resend, 10s timeout)
// packages/email/src/templates/invitation.tsx        : InvitationEmail(props)  — React Email, INLINE styles incl. hex
// packages/email/src/templates/invitation.render.ts  : renderInvitationEmail(props) => { html, text }  (render + plainText)

// api-server endpoints/iam/send-invitation-email.ts — THE PATTERN to mirror:
resolveInviteEmailConfig(): reads emailEnv.RESEND_API_KEY / EMAIL_FROM / EMAIL_REPLY_TO (throws if key/from missing)
sendInvitationEmail(input): resolve config -> renderInvitationEmail -> getEmailService(cached) -> service.send(...)
   try { send } catch (error) { logger.error("invite.email_send_failed", ...) }   // <-- NEVER throws to the caller
```

### 2.6 The head-coach lookup pattern (single-occupancy → at most one)

```
// e.g. endpoints/iam/users-admin-update.ts
prisma.user.findFirst({ where: { role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] } })   // mappers/iam/enum-maps.ts
// UserRole / ROLE_HOMES in contracts/iam/auth ; HEAD_COACH single-occupancy is enforced + tested
```

The notify recipient = that user's `email`. If there is **no head coach** (or no email env) → **skip the email, log, and still succeed** the submission.

### 2.7 The product + the CTA hook-point

```
// contracts/cms/product/product.schema.ts: productSchema { id, slug (/^[a-z0-9-]+$/), title, description, features[], prices[], ... }
// lib/components/ui/product-modal.tsx: <Button onClick={onGetStarted ?? onClose}>{actionLabel}</Button>   // onGetStarted is the hook-point
// consumers of useProductModal + <ProductModal>:
//   modules/storefront/sections/grid/index.tsx        — onGetStarted = router.push(`/contact?program=${slug}`)   (REPLACE with the lead modal)
//   modules/home/sections/storefront-programs-preview/index.tsx — onGetStarted NOT passed (wire it)
// lib/hooks/use-product-modal.ts owns the product-modal open/close + selectedProduct state
```

---

## 3. Build decisions (ratified — build to these; surface a counter only with a contentful reason)

- **D7-REUSE-MODEL** — the lead reuses `MarketingContactSubmission` (`program` = chosen plan slug); **NO Prisma change**, **NO new `cms/lead` entity**. The lead lives in the `cms/contact` context (same model, same admin pipeline).
- **D7-LEAD-SCHEMA** — a **separate** `createLeadSubmissionSchema` in `contracts/cms/contact` (name optional · contact required · message optional · program required), reusing `stripHtmlAndControlChars` + `CONTACT_CONSTANTS` bounds. The generic `createContactSubmissionSchema` is **unchanged** (so `/contact` keeps name+message required + the visible program select).
- **D7-PARALLEL-PATH** — a parallel inbound path, not a fork of the contact one: new `cmsLeadInboundApi.createLead` (create with `message: data.message ?? ""`, then notify), new `POST /api/public/lead` (mirror the contact route: `withPublicRoute` + `withRateLimit(PUBLIC)` + `createPostHandler`), new `useSubmitLead` + `createLeadAPI`. The generic `/contact` stack stays byte-untouched (lower risk). _(Rule-of-two: this is the 2nd inbound — a copy is fine; consolidate only if a 3rd appears.)_
- **D7-EMAIL-BEST-EFFORT** — the head-coach notify mirrors `sendInvitationEmail`: resolve config from `emailEnv`, render a new template, `service.send`, **wrapped in try/catch that logs and never throws**. Email failure / no head coach / missing env → the submission **still returns success**. Email is best-effort, never on the critical path.
- **D7-LEAD-EMAIL-TEMPLATE** — a new `packages/email/src/templates/lead-notification.{tsx,render.ts}` (+ templates barrel export), mirroring `invitation.{tsx,render.ts}`. Contents: who (name or "Someone"), how to reach them (contact), which program (program slug/title), the message if any, timestamp. **Inline styles incl. hex are correct here** (email, not app UI).
- **D7-LEAD-MODAL** — the lead form is a `BaseModal` (`<LeadFormModal>`, its own file) opened from `product-modal`'s `onGetStarted`, carrying `program = product.slug` under the hood (no visible program field; show the chosen plan title as read-only context). It **supersedes** the storefront grid's `router.push('/contact?program=...')`. Manage the lead-modal open state by extending `use-product-modal` (it already owns the product-modal flow; lead is the next step) — keep both consumers symmetric. Mirror the contact form's success/error states.
- **D7-CONFIG-DUP-FLAGGED** — the email-config resolver (`emailEnv` → `{apiKey, from, replyTo?}`) is now used by invite + lead. Mirror it locally for this slice (a small copy); **flag in the close-out** to consolidate into a shared `@repo/email` (or api-server shared) resolver on a 3rd consumer (rule-of-two).

---

## 4. Scope (the vertical slice)

### A. [CONTRACT] `contracts/cms/contact` — the lead schema (D7-LEAD-SCHEMA)

`createLeadSubmissionSchema` (name optional · contact required · message optional · program required), `createLeadSubmissionRequestSchema = createLeadSubmissionSchema`, response = reuse the `{success, message}` shape. Reuse `stripHtmlAndControlChars` + `CONTACT_CONSTANTS`. Export from `cms/contact/index.ts`. Add api-schema test cases mirroring the contact ones (the field-rule divergence is the thing to lock).

### B. [SERVER] `endpoints/cms/contact` — lead inbound + notify (D7-PARALLEL-PATH, D7-EMAIL-BEST-EFFORT)

- `cmsLeadInboundApi.createLead(data)`: `prisma.marketingContactSubmission.create({ name, contact, program, message: data.message ?? "" })` → `mapToContact`; **then** `await sendLeadNotificationEmail(submission)` inside the service (or the handler) — but the notify's own try/catch must keep a send failure from failing the create response.
- `sendLeadNotificationEmail(submission)`: find the head coach (`findFirst role HEAD_COACH`) → email; if none / no env → log + return (graceful). Resolve config from `emailEnv`, `renderLeadNotificationEmail`, `service.send`, try/catch + `logger.error("lead.email_send_failed", ...)`.
- Export `cmsLeadInboundApi` from the cms barrel (mirror `cmsContactInboundApi`).
- **Gated api-server test** (the suite is owner-gated — see §7): the create persists with `program` + the message default; the email service is **called with the head-coach recipient** (mock the email port); a **no-head-coach** case still succeeds without sending.

### C. [EMAIL] `packages/email` — the lead-notification template (D7-LEAD-EMAIL-TEMPLATE)

`templates/lead-notification.tsx` (React Email, mirror `invitation.tsx`) + `lead-notification.render.ts` (mirror `invitation.render.ts`) + the templates barrel export.

### D. [ROUTE] `apps/marketing/app/api/public/lead/route.ts`

Mirror `/api/public/contact`: `withPublicRoute(withRateLimit(createPostHandler(handler, createLeadSubmissionRequestSchema, createLeadSubmissionResponseSchema), RATE_LIMIT_TIER.PUBLIC))`; handler calls `cmsLeadInboundApi.createLead`.

### E. [CLIENT] marketing hook + api-client

`lib/api/endpoints/lead.ts` (`createLeadAPI` → `client.request("/api/public/lead", "POST", data)`) + `lib/hooks/use-lead.ts` (`useSubmitLead`), both barrel-wired (`lib/api/index.ts`, `lib/api/endpoints/index.ts`, `lib/hooks/index.ts`).

### F. [UI] the lead form modal + wire both CTAs (D7-LEAD-MODAL)

- `<LeadFormModal product open onClose>` (its own file under `lib/components/ui/`): `BaseModal`; read-only "You're getting: {product.title}"; three fields — name (opt) · contact (req) · message (opt, multiline) — MUI `TextField` floating labels + `react-hook-form` + `zodResolver(createLeadSubmissionSchema)`; `program = product.slug` submitted under the hood; success + error states mirroring the contact form; uses `useSubmitLead`.
- Extend `use-product-modal` (or a sibling hook) to own the lead-modal open state + chosen product.
- Wire `onGetStarted` in **both** consumers (storefront grid — replacing the `/contact?program=` redirect; home preview — currently unwired) to open `<LeadFormModal>` with the selected product.

---

## 5. Sacred / constraints

- **§0 governs:** marketing idiom = visual SSOT; contracts + decisions = domain; the email template is the one place inline-hex is correct (not app UI).
- **NO Prisma change** (model reuse; `message ?? ""`; nullable name/contact/program). Flag, don't migrate, if you think otherwise.
- **NO checkout / payment / billing** — lead-capture only (post-launch trigger).
- **Generic `/contact` stays byte-untouched** — separate schema/route/hook/api-client; contact keeps name+message required + the visible program select.
- **Email is best-effort** — head-coach notify NEVER blocks or fails the submission (try/catch, logged-not-thrown, mirror `sendInvitationEmail`). No head coach / no env → log + succeed.
- **Public-endpoint hygiene:** `RATE_LIMIT_TIER.PUBLIC` (mirror contact) + `stripHtmlAndControlChars` on every text field (via the schema transform).
- **Theme tokens / no-hex / floating labels / one-component-per-file / MUI + `@repo/ui`** — for the marketing UI. **Mobile-first.**
- **No `lms`/athlete code is touched** — this is `cms` + marketing + email only.

---

## 6. Out of scope (other waves — do NOT build here)

- **Checkout / payment / subscription / billing** — post-launch (triggers on a second paying coach).
- **Generic `/contact` email-notify** — should the coach also be emailed for plain contact submissions? **Owner decision, deferred** — minimal scope here is lead-only. (Easy follow-up: call the same notify from `cmsContactInboundApi`.)
- **A `source` field (CONTACT vs LEAD) on the model** — not added; `program` presence + the admin pipeline differentiate enough. Flag if the admin view genuinely needs the distinction.
- **Admin lead-management UI** — the existing admin `contacts` CRUD already lists submissions (incl. `program` + `status`); no admin change here.
- **Reading `?program=` on the generic `/contact` page** — existing behavior, not the lead path's concern.

---

## 7. Acceptance

- On the marketing site (storefront grid AND home preview), clicking a program's CTA opens the lead form modal with that program under the hood; submitting with **name empty + message empty + contact filled** succeeds (lead field rules), and with **contact empty** is rejected client-side.
- A `MarketingContactSubmission` row is created with `program` set and `message` defaulting to `""` when omitted; it appears in the admin `contacts` list.
- The head coach receives an email (best-effort): verified by the gated api-server test asserting the email port is called with the head-coach recipient; **no head coach / no email env → the submission still succeeds** (no throw).
- The generic `/contact` page is unchanged and still works (name+message required, program select).
- `pnpm dep:check`, `check-types`, `lint` clean. The new inbound endpoint is covered by a test in the **gated** api-server suite (running it needs owner approval — `api-server-serial-tests`); green on reseed.
- Close-out docs land **in** the feature PR (`closeout-before-pr`): ratify any new build decisions; record the D7-CONFIG-DUP consolidation carry-forward and the §6 owner-deferred OQs.

---

## 8. Process

`/feature` (full; de-escalate to `small` at Gate A only if it proves trivial). **`db:reset` world, NO migration files** (no schema change). Orchestrator reviews every implement wave via **`git diff`**, never agent self-report. Worktree run — heed the worktree gotchas (format-lint hook cwd misfire; api-server tests need a manual `.env` copy + `DATABASE_URL` injection — see memory `worktree-feature-run-gotchas`). Land close-out IN the PR. ≤1 full `/feature` per session.

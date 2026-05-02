# 0021. Architectural risks — six-month horizon

- **Status:** Accepted
- **Date:** 2026-04-13
- **Deciders:** Lead Architect
- **Tags:** `architecture`, `risk`, `planning`

## Context

This ADR answers "What will hurt the most to retrofit in six months?" These are not bugs or code quality issues — they are architectural decisions that become exponentially harder to change once downstream consumers accumulate. Ten concrete risk areas were surfaced and each was verified against the codebase at write time.

The project is pre-launch. Three apps (admin working, marketing working, platform scaffolded). No production traffic, no paying users. This is the last window where foundational decisions are cheap.

## Decision

Each risk is documented below with: current state, trigger (when it becomes critical), and recommended approach. Risks are grouped into tiers by urgency.

### Tier 1 — Must resolve before first paying user

**1. Billing domain design.** Schema models exist (`Subscription`, `Transaction`, `Price` with `stripePriceId/stripeProductId`) but API and contracts are placeholder directories. `Transaction.idempotencyKey` is `NOT NULL` (already tightened). No webhook signature verification infrastructure. No idempotency middleware. No billing-aware access policies.

- **Trigger:** First payment integration work begins.
- **Approach:** ADR for billing architecture (Stripe checkout flow, webhook idempotency, subscription lifecycle state machine). Build billing API + contracts before writing any Stripe integration code.

**2. Email and notification service.** Email port exists (`infrastructure/email/port.ts`) with `send(input)` interface. A Resend adapter is live via `@repo/email/createResendEmailService` and is wired into invite flows. `MarketingContactSubmission` records are still created without sending confirmation emails to submitters; broader notification coverage (password reset, subscription receipts, coach notifications) is not yet built.

- **Trigger:** Any new feature that needs to send email beyond invites (contact confirmation, password reset, subscription receipts, coach notifications).
- **Approach:** Build a notification service layer above the existing port that owns templates, locale, retry/failure handling. Queue port (already scaffolded) handles async delivery.

**3. Job queue and scheduled work.** Queue port exists (`infrastructure/queue/port.ts`) with producer-only `enqueue<T>()` interface. No consumer registration, no scheduled job infrastructure. `CoachActionItem` has three `AUTO_*` resolution reasons (`AUTO_CONDITION_CLEARED`, `AUTO_ENROLLMENT_ENDED`) that imply background processing, but resolution currently runs synchronously during dashboard data aggregation.

- **Trigger:** First feature that cannot tolerate synchronous execution in a request/response cycle (email sending, webhook processing, action item auto-resolution on schedule).
- **Approach:** Pick a provider (Inngest recommended for Vercel serverless). Implement queue adapter + consumer registration. Add cron port for scheduled jobs. Migrate `AUTO_*` resolution out of dashboard computations into scheduled background jobs.

### Tier 2 — Should resolve before public launch

**4. Internationalization readiness.** No i18n infrastructure exists. Hardcoded English strings are scattered across shared packages:

- `create-crud-hooks.ts`: toast messages with `.toLowerCase()` (English-only method).
- `PROCESS_STATUS_LABELS`, `HEALTH_STATUS_LABELS`, `GENDER_LABELS` in contracts constants.
- `formatPrice` and `formatDate` use hardcoded `DEFAULT_LOCALE = "en-US"`.
- Platform hooks: "Marked as contacted", "Athlete enrolled", "Week copied", etc.

- **Trigger:** First non-English user or market expansion decision.
- **Approach:** Phase 1 (now): make `formatPrice`/`formatDate` accept locale parameter with `DEFAULT_LOCALE` fallback — covered by bullet 7.2.B. Phase 2 (pre-launch): extract all user-facing strings to a message catalog. Phase 3 (post-launch): full i18n with `next-intl` or similar.

**5. SEO from CMS, not static config.** `MarketingPage` model has `seoTitle` and `seoDesc` fields in the database. The marketing app ignores them — `PAGE_SEO` in `apps/marketing/src/lib/seo/` is a hardcoded config object. Admin cannot change page SEO through the CMS.

- **Trigger:** SEO becomes a business priority (pre-launch content optimization, marketing team onboarding).
- **Approach:** Wire `seoTitle`/`seoDesc` from page API responses into Next.js `generateMetadata()`. Remove `PAGE_SEO` static config. Admin already has the editing UI via `MarketingPageSection` — just needs the plumbing.

**6. CMS governance.** `MarketingBlogPost` has an `isPublished` boolean toggle — not a draft/publish workflow. No content versioning, no revision history, no preview mode, no rollback capability. `MarketingPage` has no publish workflow at all.

- **Trigger:** Multiple content editors or non-technical content managers start using admin.
- **Approach:** Phase 1: add `status` enum (DRAFT/PUBLISHED/ARCHIVED) replacing boolean flags. Phase 2: revision history table with diff view. Phase 3: preview mode with draft URL tokens. Each phase is independently valuable.

### Tier 3 — Strategic, monitor for trigger

**7. Platform vs product separation.** No clear boundary between "platform infrastructure" (auth, billing, storage, notifications) and "product features" (coaching, LMS, CMS). Currently interleaved in the same packages. Becomes painful when a second product vertical is built on the same platform.

- **Trigger:** Decision to build a second product offering (e.g., group classes, nutrition coaching) on the same platform.
- **Approach:** The bounded context work from section 1 (contexts: IAM, Storage, CMS, LMS, Coaching, Billing) already provides the foundation. Platform = IAM + Storage + Billing. Products = CMS + LMS + Coaching. The boundary is documented in `BOUNDED-CONTEXTS.md` and enforced by dependency-cruiser. No code change needed until a second product exists.

**8. `formatPrice` precision loss.** `minimumFractionDigits: 0, maximumFractionDigits: 0` rounds $9.99 to "$10". Acceptable while all products use round-number pricing, but will silently corrupt display for fractional prices.

- **Trigger:** Immediate — fixed in bullet 7.2.A of this section.

## Consequences

- **Positive:** Every architectural risk now has a documented trigger condition. No risk is ignored, but none are prematurely built either. Future sessions can check triggers against project state and act when appropriate.
- **Negative:** Tier 1 items (billing, email, queue) remain unbuilt. The project cannot accept payments or send emails until these are implemented.
- **Neutral:** This ADR replaces speculative infrastructure with documented decisions. The port scaffolding from section 1 (1.4.A storage, 1.4.C email/cache/queue/payment) provides the seams — this ADR provides the strategy for when and how to fill them.

## Removed bullets

- **dayjs inconsistency (original §7 bullet).** Removed as inapplicable. dayjs is not in the repository. `date-helpers.ts` uses native `Intl.DateTimeFormat` for timezone-aware operations — this is the correct modern approach with zero dependency overhead. Frontend date utilities in `@repo/shared` also use native `Intl`. No abstraction layer needed over standard APIs.

## References

- ADR 0018: Security deferred decisions (auth strategy, rate limiting — Tier 1 prerequisites for billing)
- ADR 0019: Database strategy deferred decisions (Subscription.id, soft-delete write ops — billing prerequisites)
- `docs/BOUNDED-CONTEXTS.md` §9: dependency direction rules (platform vs product boundary)
- `packages/api-server/src/infrastructure/`: port scaffolding for email, queue, cache, payment, storage

# storefront-billing — charter

**Status: founded 2026-09-23; in `initiatives/ACTIVE` since 2026-09-23.**

**Goal.** Money stops being a manual chase. Every product on the storefront binds to training plans; a purchase creates the account, enrolls the athlete and starts a Monobank-backed subscription (auto-renew) or a one-off paid period; access on the web AND in the App-Store app follows subscription state by itself; the coach sees who is paid, in grace, or closed without keeping a list anywhere else.

**Driving decision(s).** post-uat PU-14 (owner-set scope 2026-07-27: every storefront product binds to a plan; purchase → auto-enroll; recurring until cancel) · athlete-core D-LAYERS (subscription/access is the RIGID layer: pay-to-ride by the calendar, "the machine refuses, the coach no longer argues it by hand") · BOUNDED-CONTEXTS §8 planned invariant **Access = Subscription State** · `docs/personas/denys.md` §5.2 (платишь — едешь, не платишь — сходишь) · **ADR-0044** (this initiative's first deliverable: Monobank as the provider, subscriptions per product on a provider-agnostic core — supersedes ADR-0008 and ADR-0014). Trigger: Denys's inbound pull 2026-09-22 («по оплате через сайт монобанк ещё нет инфы?» · «заебался гоняться за неплательщиками»). The roadmap's "second paying coach" trigger is superseded by this pull.

**Why Monobank, not Apple IAP (the 2026-09-22 debate, settled by facts).** Every athlete is in Ukraine today (Denys, 2026-09-23: «все сейчас из Украины… для иностранцев я NoName»). Mono takes 1.3% on Ukrainian cards vs Apple's 15%; Denys wants 4-week periods, which App Store subscriptions cannot express (1w/1m/2m/3m/6m/1y only); there is no App Store listing to sell IAP through (membership lapsed — apex-sunset AS-1); and Mono's checkout serves every device, incl. iOS, while IAP serves iOS only. IAP stays a possible LATER adapter for an English-market push — ADR-0044 keeps the seam. Apple's guideline 3.1.1/3.1.3 is honored: the iOS app never shows a purchase CTA or link.

**Acceptance criteria (properties, not tasks).**

- A stranger opens the storefront, buys a product, and — with nobody's involvement — ends up with an account (password set via the existing invite email), an active subscription, and the bound plan on their web timetable.
- A card that fails to renew keeps access for the grace window and then closes it: the web shows the wall, the App-Store app shows the inactive-subscription text; paying again re-opens both from the webhook, not from a cron tick.
- An athlete cancels from their profile; access lasts to the end of the paid period; no further charge is taken; re-subscribing later re-boards the same plan through the existing `PAUSED → ACTIVE` transition.
- A one-off period purchase (no card stored) grants the same access window, emails a renewal reminder before it ends, and closes access at the end.
- The coach roster shows paid / grace / closed per athlete and plan; comp access is a rare head-coach action with an end date, never a routine.
- Every current athlete keeps access through the cutover: a launch-day grant until date X, then the machine closes non-payers by itself. Denys announces; nobody revokes by hand.
- Every Monobank webhook is signature-verified and idempotent; every payment is a `Transaction` row; a lost webhook or a Mono outage is recovered by the reconciliation cron, never by a human.
- Context boundaries hold: LMS / Coaching / mobile-compat stay Billing-blind (dep-cruiser); the access gate lives in `authz/`.

**Scope.** Provider-agnostic subscription core (per product) · `ProductPlan` bindings with JOIN / COPY delivery · prices = amount + period + auto-renew · access resolution per enrollment · MANUAL provider (comps, cohort grant) · Monobank adapter (invoices, tokenization, merchant-initiated charges and/or native subscriptions — the W0 spike decides, D-3) · webhook route + reconciliation cron + transactional emails · storefront CTA → public checkout on the platform · post-payment account creation via the existing invite flow · athlete profile subscription card + the wall · iOS shim soft wall · coach roster / athlete drawer payment state + comp grant · admin product↔plan binding, prices, user billing panel, subscriptions list · Ukrainian versions of the buyer-facing pages + an offer/requisites page (Mono's internet-acquiring precondition) · cohort rollout (grant, date X, announcement, first live payments watched).

**Non-goals (→ where they go).**

- Apple IAP adapter → a later initiative when Denys goes to the English market; ADR-0044 keeps the seam (`provider` discriminator, port/adapter).
- Pause → decided NO (D-6); the UX equivalent is cancel + one-click renew on the stored card token.
- Trials, promo codes, refunds UI (refunds happen in the Mono cabinet), PDF receipts, EU VAT, multi-currency pricing → post-launch backlog (`deferred.md`).
- Blog localization → not needed for acquiring approval; only buyer-facing pages get Ukrainian.
- Any Swift change / mobile-app redesign → the future client-redesign initiative (apex-sunset D-2).

**Sacred (do not touch).**

- **The iOS wire contract** (apex-sunset charter): raw `Authorization`, HTTP-200-only success, `yyyy-MM-dd`, never `isRestDay:false` with a null program, 403 = sign-out. The soft wall is an ordinary program DTO with text cells — never a new status code, never a link, never a CTA (Apple 3.1.1).
- **Prod data is additive-only** for this initiative: existing users, enrollments, published days are never deleted or rewritten; the cohort grant adds rows.
- **Athlete navigation stays FREE** (athlete-core D-LAYERS): billing gates access; it never shifts the timetable, hides history, or touches records/profile.
- **Dep-cruiser context rules** (`api-server-*-no-billing`, `contracts-*-no-billing`, `api-server-mobile-compat-no-cms-billing`): the shim and LMS reach Billing only through the `authz/` gate.
- **Migrations via `prisma migrate` + `db-migrate`** (ADR-0042), aggressive and bridge-free: no interim patches, no dual-write of old and new billing shapes.

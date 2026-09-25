# storefront-billing — state (the board)

**Updated:** 2026-09-25 (night) — **the named tunnel is live and the webhook fixture exists (SB-14 closed):** `mono-dev.thedisciplineprogram.com` → this box; mono's webhooks arrived with a valid `x-sign` and are promoted to `spike/fixtures/` (created / processing / success + the test pubkey); no webhook fires on invoice expiry. Earlier: **D-3 RATIFIED = (b): own scheduler + merchant-initiated charges on the tokenized card.** The spike proved the loop on the card form and on the mono-app channel (the owner paid from his mono app, a token came back, a merchant-initiated charge on it succeeded); the hosted page's levers are known (`allowTokenizationChoice`, `paymentMethods` with `pan`); renewals need no 3DS. 0.2 closed; the webhook capture waits on the SB-14 tunnel and becomes the 0.5 fixture. Earlier: **0.2 spike run against the test merchant: the (b) loop is proven (tokenize → merchant-initiated charge ×3, synchronous success), native `4w` subscriptions also work in test mode but expose no retry semantics and no basket; D-3 PROPOSED (b), P0.3 next; webhooks wait on the SB-14 tunnel.** Earlier the same day: **P0.0 done: the local Docker stack is the target of every dev server, test run and migration rehearsal (D-14).** `docker-compose.yml` (`postgres:17-alpine`, `tdp` / `tdp_test` / `tdp_shadow`), `task stack:*` + `task test:api`, `docs/runbooks/local-stack.md`; the owner's env files now point at it with the Neon dev lines commented. Gate passed: athlete / coach / admin sign in on localhost, iOS shim sign-in 200, api-server suite green in 2 min 32 s against `tdp_test`. Two findings: prod parity wants Postgres 17 (CI stays 16, SB-15); Cloudflare quick tunnels are unreachable from the owner's network, so Mono webhooks in 0.2 need a named tunnel on the zone in Vladyslav's account (SB-14, owner's one-time login).

Prior (2026-09-24): **Denys answered the coach-side pack** (D-11 amended: grace 2 days, personal products per style, trial as a zero-price product → D-13, closed = no program visibility; SB-10 closed = English). Separately he could not sign into the App-Store app after the AS-22 notice — his app credential is his OLD legacy login + app password (id 2 was a CREATE row on a different address than his coach account), so the website password does not apply; answered in chat, nothing to change in code. Vercel runtime logs (Hobby, 1 h retention) could not confirm his failure mode.

Prior: **FOUNDED 2026-09-23.** Two days of dialogue distilled: the Apple-vs-Mono debate settled by facts (every athlete is in Ukraine; 1.3% vs 15%; `4w` periods; no App Store listing), the domain model ratified by the owner («модель заходит»): subscription per product, product↔plan bindings with JOIN / COPY delivery, prices = amount + period + auto-renew, access resolved per enrollment in `authz/`, no pause, cash replaced by one-off periods, MANUAL only for comps and the cohort grant. Denys got two question packs (coach-side defaults D-11; FOP-side: he has NO mono business account yet, his accountant does not know the РРО nuance, all athletes are Ukrainian) and the P0–P4 dates. ADR-0044 drafted (supersedes ADR-0008 + ADR-0014). Work on the code starts 2026-09-24.

## Board

| #   | Phase           | Status     | Pointer                                                                                                                                                                               |
| --- | --------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0  | Foundation      | 🔵 active  | 0.0 ✅ · 0.1 ✅ · 0.2 ✅ · **0.3 migration next** · 0.4 `uk` pages · 0.5 env/port/adapter (parallel after 0.3) · 0.3 migration · 0.4 `uk` pages · 0.5 env/port/adapter · target 02.10 |
| P1  | Core            | ⬜ pending | D-3 must be RATIFIED first (0.2) · target 09.10                                                                                                                                       |
| P2  | Athlete         | ⬜ pending | target 16.10                                                                                                                                                                          |
| P3  | Coach & admin   | ⬜ pending | target 23.10                                                                                                                                                                          |
| P4  | Launch + cohort | ⬜ pending | gated by SB-5 (prod token) + SB-4 (requisites → acquiring approval) · target ~28.10                                                                                                   |

## Next action

**▶ P0.3 W0 migration NEXT (planner → `/step`).** Planner writes the migration corpus + executor prompt from `domain-model.md` and ADR-0044: `BillingProvider { MONOBANK, MANUAL, FREE }`, `PlanDelivery { JOIN, COPY }`, `ProductPlan`, `Price` = amount + period + `autoRenew`, `Subscription` per `(userId, productId)` with `cardToken` / `walletId` for (b), `PlanEnrollment.subscriptionId`, `Transaction` + `BillingWebhookEvent`; retire `stripe*`, `PriceInterval`, `TRIAL` (SB-8); run the planner-discipline (h) mutation-invariant trace on the new uniques before locking; prod data is additive-only (Sacred). Then 0.4 (`uk` pages, no schema dependency) and 0.5 (env/port/adapter/contracts, needs 0.3 merged) as parallel executors. The tunnel and the `x-sign` fixture already exist (`spike/fixtures/webhook-invoice-success.json` + `monobank-test-pubkey.pem`), so 0.5 needs no further capture; `task stack:tunnel` exposes the platform for live webhook tests in P1.2.

## Open decisions awaiting ratification

- none — D-3 ratified 2026-09-25 (b); the next decisions surface in the 0.3 corpus (naming, uniques) and are recorded there.

## Live carry-forwards

SB-1 (browser-only Mono docs + skill archive) · SB-2 (FOP terminal currency) · SB-3 (РРО — Denys) · SB-4 (requisites — Denys) · SB-5 (prod token — Denys) · SB-7 (roster projection, 3.2) · SB-8 (retire Stripe shapes, 0.3) · SB-9 (tax consequence — owner) · SB-11 (iOS athletes have no enrollment, 4.1) · SB-12 (newcomers + the app, rides on AS-1) · SB-13 (apex-sunset decommission runs in parallel, separate PRs) · SB-15 (CI Postgres 16 → 17 bump).

## Gotchas a resuming session must know

- **The iOS shim is Billing-blind by dep-cruiser** (`api-server-mobile-compat-no-cms-billing`); so are LMS and Coaching. The ONLY door is `authz/` (`resolveEnrollmentAccess`, D-7). Do not add a Billing import anywhere else.
- **The app's wire traps are sacred** (apex-sunset charter): the soft wall is a normal 200 program DTO with text; never a new status, never `isRestDay:false` with a null program, never a link (Apple 3.1.1).
- **ADR-0008 (singleton subscription) and ADR-0014 (Stripe) are superseded by ADR-0044** — do not design around `userId @unique` or `stripe*` columns; the W0 migration removes them.
- **The roadmap's "second paying coach" trigger is superseded** by Denys's 2026-09-22 pull — do not re-litigate "billing is post-launch".
- **Existing iOS athletes have no `PlanEnrollment`** (SB-11): the gate must treat "no grant object" as OPEN until the 4.1 grant, or the cutover kicks everyone.
- **Denys has no mono business account yet** (SB-5): dev/preview run on the owner's test token; only P4 waits on him.
- **Every local run targets the Docker stack (D-14).** Dev servers → `tdp`, `task test:api` → `tdp_test`, `pnpm db:migrate` → `tdp_shadow`; the Neon lines in the env files are commented and stay that way. `task stack:reset` wipes local data; `stack:down` keeps it.
- **Mono webhooks (verified):** sign over the RAW body bytes; a merchant-initiated charge fires `processing` then `success` ~50 ms apart (order-tolerant handler); invoice creation fires `created`; expiry fires nothing — reconcile by polling. Fixtures in `spike/fixtures/`.
- **Port 3002 belongs to another project's Django dev server on the owner's box** — for checks admin runs on 3012 (`pnpm --filter admin exec next dev --port 3012`).

# Step 0.5 — The Monobank seam: env, payment port, adapter, billing contracts (storefront-billing P0.5)

Invoke the `/feature` skill with everything below as its argument (calibre: **full**) and
run its pipeline: research → plan (STOP at the plan gate and report to the PLANNER session
that spawned you — not the repo owner) → implement → internal review (STOP at review-flow's
triage gate with the report; the ruling arrives as a follow-up message) → PR. This file is
skill INPUT, not a plan override; where it pins a live-verified fact, trust it over
guessing, and verify anchors against the tree.

## Mission

ADR-0044 puts Monobank behind a provider-agnostic billing core. The core (the subscription
state machine of 1.1, the webhook ledger of 1.2, the renewal cron of 1.3) never speaks to
the vendor: it calls a `PaymentPort` in `packages/api-server/src/infrastructure/payment/`,
and exactly one adapter knows Monobank's URLs, payloads and signature scheme. Today that
directory holds a Stripe-era hosted-checkout scaffold with no adapter; the billing contracts
directory is a README; the card token has no cipher. This step lays the whole seam so that
1.1 starts on endpoints, not on plumbing.

One delivery PR, six deliverables:

1. Two env modules: `@repo/env/monobank` and `@repo/env/billing`, registered everywhere an
   env variable is registered in this repository.
2. The `PaymentPort`, reshaped around what the core needs under D-3 (b), in our vocabulary.
3. The Monobank adapter: HTTP against the verified endpoints, ECDSA webhook verification
   over the raw bytes, a cached signing key, unit tests on a fetch spy, fixtures from the
   spike.
4. The billing contracts (`subscription`, `transaction`, `product-plan`), the `Currency`
   value object hoisted into `common/`, and the billing mappers.
5. The card-token cipher (D-20): the token cipher generalized, a billing instance keyed by
   `BILLING_ENCRYPTION_KEY`.
6. The documents that describe the seam.

Not yours: endpoints, routes, the state machine, the webhook route and ledger, the cron,
checkout, the Vercel environment (the planner adds the variables), the live smoke against
Monobank's test API (the planner runs it with the owner's token; you never touch a token).

## Read before planning

- `initiatives/storefront-billing/{charter.md,domain-model.md,decisions.md}` — the Sacred
  list, §6 "Provider seam" of the domain model, D-1 / D-3 / D-10 / D-17 / D-20.
- `initiatives/storefront-billing/monobank-notes.md` — every verified Monobank fact; the
  "0.2 spike" section is what you build against.
- `docs/adr/0044-monobank-provider-and-subscription-per-product.md`, `docs/adr/0013-vercel-blob-for-image-storage.md`.
- `docs/planner-discipline.md` (a)–(i); `docs/BOUNDED-CONTEXTS.md` §5, §8, §9.
- `packages/api-server/src/infrastructure/README.md` — the port convention you extend.
- The reference adapter, verbatim: `packages/api-server/src/infrastructure/legacy-mobile/{port.ts,rest-adapter.ts,rest-adapter.test.ts,index.ts,README.md}`;
  the storage adapter: `infrastructure/storage/{port.ts,vercel-blob-adapter.ts,index.ts}`;
  the DI seam of a consumer: `endpoints/storage/{index.ts,upload.ts}`,
  `endpoints/coaching/mobile-publish/{index.ts,create-mobile-publish-api.ts}`.
- `packages/api-client/src/{client.ts,client-types.ts,client-retry.ts,client-response.ts,client-error-mapping.ts}` — before you choose the transport.
- `packages/api-server/src/utils/{token-cipher.ts,token-cipher.test.ts}` and its four
  consumers under `endpoints/coaching/mobile-publish/`.
- `packages/contracts/src/{common/index.ts,common/period.ts,common/money.ts,entities/cms/product/*}`,
  `packages/api-server/src/mappers/cms/{enum-maps.ts,product.mapper.ts}` — the shapes you
  hoist and mirror.
- The consumer inventory below — every file, verbatim, before you plan the rename.

## Live-verified facts (2026-09-25 spike, re-read from the captures on 2026-09-29 — AUTHORITATIVE)

**Transport.** Base `https://api.monobank.ua`, header `X-Token: <merchant token>`; a personal
token from `api.monobank.ua` is the test-mode token (`GET /api/merchant/details` →
`{ merchantId: "test_…", merchantName, edrpou }`). Requests and responses are JSON. The API
ignores unknown top-level fields silently: a 200 never proves a field was understood.

**Endpoints this step wraps** (request → response, as captured):

| Call                                          | Request body / query                                                                                                                                                                                                                                    | Response                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/merchant/invoice/create`           | `{ amount, ccy: 980, merchantPaymInfo: { reference, destination, comment?, basketOrder: [{ name, qty: 1, sum, total, unit: "шт.", code }] }, redirectUrl?, webHookUrl?, validity?, paymentType: "debit", saveCardData?: { saveCard: true, walletId } }` | `{ invoiceId, pageUrl }`                                                                                                                                                                                                                                                                                                                                                                                                            |
| `GET /api/merchant/invoice/status?invoiceId=` | —                                                                                                                                                                                                                                                       | `{ invoiceId, status, amount, ccy, finalAmount?, createdDate, modifiedDate, reference?, destination?, payMethod?, paymentInfo?: { rrn, approvalCode, tranId, terminal, bank, paymentSystem, country, fee, paymentMethod, maskedPan }, walletData?: { walletId, cardToken, status: "new" \| "created" \| "failed", maskedPan, paymentSystem } }` — `status` ∈ `created · processing · hold · success · failure · reversed · expired` |
| `POST /api/merchant/wallet/payment`           | `{ cardToken, amount, ccy, initiationKind: "merchant", merchantPaymInfo, paymentType: "debit", webHookUrl?, redirectUrl? }`                                                                                                                             | synchronous 200 `{ invoiceId, status: "success", amount, ccy, createdDate, modifiedDate }`; with `initiationKind: "client"` instead `{ invoiceId, status: "processing", tdsUrl, … }` (3DS)                                                                                                                                                                                                                                          |
| `DELETE /api/merchant/wallet/card?cardToken=` | —                                                                                                                                                                                                                                                       | documented (deletes a stored card); **no capture exists** — implement from the docs table in `monobank-notes.md`, unit-test the request shape, and say in the README that it is unverified by execution (SB-38)                                                                                                                                                                                                                     |
| `GET /api/merchant/pubkey`                    | —                                                                                                                                                                                                                                                       | `{ key: "<base64>" }` — the base64 decodes to the PEM text of an EC P-256 public key (`-----BEGIN PUBLIC KEY-----`)                                                                                                                                                                                                                                                                                                                 |

Not wrapped in this step (a later step adds them if a consumer appears): `GET wallet?walletId`
(lists stored cards: `{ wallet: [{ cardToken, maskedPan, country }] }`), `invoice/cancel`
(refund), `invoice/remove`, `subscription/*` (D-3 chose (b): no native subscriptions),
`paymentMethods` on the invoice (the lever exists: `apple`, `google`, `mono`, `monopay`,
`pan`; add it when D-3's production check needs it), `allowTokenizationChoice` (never sent:
the hosted page would show a toggle the athlete can switch off).

**Errors.** Every 4xx seen is `{ errCode: string, errText: string }` (`errCode` `"1001"` or
`"BAD_REQUEST"`, `errText` like `invalid 'amount'`, `invalid date format`, `invalid entry in
'paymentMethods' array: 'card'`). No 5xx was captured.

**Dates.** Invoice bodies carry `2026-09-25T10:55:41Z`; the synchronous `wallet/payment`
reply carries `2026-09-25T14:23:28.764528+03:00` (fractional seconds, an offset). Accept
both; reject anything that is not a datetime.

**Money.** `amount` is in minor units (kopiykas); `ccy` is numeric ISO 4217 (`980` UAH,
`840` USD, `978` EUR). Our `Currency` enum maps 1:1; an unknown `ccy` in a response is a
parse failure.

**Webhooks.** `POST` with `Content-Type: application/json` from `Go-http-client/1.1`;
header `x-sign` = base64 ECDSA signature (P-256, SHA-256) over the RAW request body bytes.
Verify the bytes as received: `createVerify("SHA256").update(rawBody).verify(pem,
Buffer.from(xSign, "base64"))`. A re-serialized body does NOT verify. The body is the
invoice status shape above (no envelope). A merchant-initiated charge fires `processing`
(`finalAmount: 0`) then `success` about 50 ms apart; an invoice fires `created` at once; an
expiry fires nothing. Delivery: if we do not answer 200, Monobank retries up to three times.
Three captured, verified webhooks and the test merchant's public key are on disk:
`initiatives/storefront-billing/spike/fixtures/{webhook-invoice-created,webhook-invoice-processing,webhook-invoice-success}.json`
(each carries `rawBody`, `headers["x-sign"]`, `verified: true`) and
`spike/fixtures/monobank-test-pubkey.pem`. **The `.pem` is NOT in git** (`.gitignore` has
`*.pem`); the JSON fixtures are. Copy what the tests need into
`packages/api-server/src/infrastructure/payment/__fixtures__/` and carry the key as the JSON
shape `GET /pubkey` returns (`{ "key": "<base64 of the PEM>" }`, produce it with
`base64 -w0` over the local `.pem`). None of the three fixtures contains a card token;
never copy a capture that does (the gitignored `spike/captures/` hold a test wallet's
token — read them for shapes, commit nothing from them).

**Repository facts.**

- `packages/env/src/*.ts` modules are `createEnv({ server, client: {}, experimental__runtimeEnv: {}, skipValidation: !!process.env.SKIP_ENV_VALIDATION, emptyStringAsUndefined: true })`;
  `packages/env/package.json` `exports` today: `./base`, `./auth`, `./blob`, `./email`,
  `./mobile-publish`, `./mobile-shim`, `./rate-limit`, `./sentry`. `turbo.json` `globalEnv`
  ends with `"MOBILE_PUBLISH_ENCRYPTION_KEY", "MOBILE_SHIM_JWT_SECRET", "LEGACY_MOBILE_API_BASE_URL"`.
  `packages/api-server/vitest.config.ts` `test.env` carries test values for
  `MOBILE_PUBLISH_ENCRYPTION_KEY`, `LEGACY_MOBILE_API_BASE_URL`, `MOBILE_SHIM_JWT_SECRET`.
  `.github/workflows/ci.yml` gives the build job dummy values under `SKIP_ENV_VALIDATION=1`;
  **CI is not touched in this step** (a CI edit needs the owner's word), so nothing you add
  may be validated at build time: `apps/platform/next.config.ts` keeps importing only
  `base`, `auth`, `sentry`, `mobile-publish`, `mobile-shim`.
- `createEnv` validates at import. A module that reads an env module at module scope is
  validated wherever it is imported; `utils/token-cipher.ts` does exactly that with
  `MOBILE_PUBLISH_ENCRYPTION_KEY` (it is why the marketing app cannot boot locally, SB-27).
- `infrastructure/` sits outside every context-scoped dep-cruiser rule; ports may import
  `@repo/contracts`, `@repo/env`, `@repo/errors`, `@repo/api-client`. Tests inject fakes
  into factories and never import a port's `index.ts` (its default instance reads env).
- `@repo/api-client`'s `ApiClient`: default timeout 5 s, 2 retries on 429 / 502 / 503 / 504 and
  on transport errors (`TypeError`, abort), a 15 s total budget; adds `Idempotency-Key` to
  every non-GET request by itself; `request()` throws on a 204; `parseErrorResponse` reads
  only the `{ error: { message, code, details } }` envelope — a body like
  `{ errCode, errText }` is dropped (the error keeps `status` and `url` only).
- `packages/api-server/src/endpoints/endpoints-di-bootstrap.test.ts` requires every
  request-serving subpath in api-server's `package.json` `exports` to import `ensure-di`.
  Add NO subpath export in this step; `infrastructure/payment` is imported by relative path
  from endpoints, as storage is.
- `packages/contracts/package.json` `exports` has no `./billing/*` entry;
  `packages/contracts/src/entities/billing/` holds a README only. `common/index.ts` exports
  `api-error`, `format-period`, `image`, `money`, `params`, `period`, `timezone`.
  `packages/api-server/src/mappers/` has `cms`, `coaching`, `iam`, `lms` — no context-free
  directory yet.
- `ProductCurrency` (`packages/contracts/src/entities/cms/product/product.constants.ts`)
  is consumed by, verbatim by grep: `product.constants.ts`, `product.schema.ts`,
  `product.schema.test.ts` (contracts); `mappers/cms/enum-maps.ts` (`CURRENCY_MAP`),
  `endpoints/cms/product/admin.test.ts`, `endpoints/cms/dashboard/admin.test.ts`
  (api-server); `apps/admin/src/modules/products/components/{product-pricing-card.tsx,get-currency-symbol.ts,get-currency-symbol.test.ts}`,
  `products.fixtures.ts`, `views/product-edit-view/product-edit-form.test.tsx`,
  `views/product-create-view/index.test.tsx`, `sections/products-list-section/index.test.tsx`
  (admin). `apps/marketing` and `@repo/shared` (`formatPrice` in `packages/shared/src/helpers/money.ts`)
  take the currency as a string and do not import the enum.
- The `.gitignore` ignores every `.env*` except `.env.example`, and `*.pem`. The secrets
  scanner of the pre-commit hook flags credential-bearing URLs; fixtures use placeholders.
- Hooks: pre-commit = `check-secrets` + `lint-staged`; pre-push = `dep:check` + `turbo run
lint check-types --filter="...[origin/main]"` under `SKIP_ENV_VALIDATION=1`; commit-msg =
  commitlint. `main` requires six green checks: Build, Dependency boundary check, Format
  check, Lint, Tests, Type check.

## Rulings this step is built on

- **D-1 / ADR-0044.** One adapter file speaks Monobank; config from `packages/env/src/monobank.ts`;
  consumers receive the port by factory DI. `Subscription.provider` is `MONOBANK | MANUAL | FREE`.
- **D-3 (b).** Auto-renew = the first payment tokenizes the card (`saveCardData: { saveCard:
true, walletId }`, never `allowTokenizationChoice`); each period the platform charges the
  token with `initiationKind: "merchant"`; a `processing` + `tdsUrl` reply is a failed
  renewal, not a redirect; cancel at period end drops the token (`DELETE wallet/card`).
  Native `subscription/*` is not wrapped.
- **D-10.** Every invoice and every charge carries `merchantPaymInfo` with a one-line
  basket: the product title, qty 1, `sum` = `total` = the amount, `unit: "шт."`, a `code`.
- **D-17 as amended by D-20 (owner, 2026-09-29).** The wallet id sent to Monobank is the
  platform `userId` (no column). `Subscription.cardToken` stores ciphertext produced by a
  cipher keyed by `BILLING_ENCRYPTION_KEY`, a key of its own; the ledger of 1.2 stores the
  webhook body with `walletData.cardToken` replaced by a marker, after the signature was
  verified on the raw bytes; `BillingWebhookEvent.error` and log lines carry our own
  message, never the text of a Prisma or Postgres error. This step lays the key and the
  cipher; 1.2 applies the redaction and the error rule.
- **Planner rulings for this step** (argue at the plan gate with a reason from the tree,
  otherwise build them):
  - **The port speaks our vocabulary, not Monobank's, and takes plain records, not Prisma
    rows.** Method names and result shapes are below. Statuses are a closed union of ours;
    every Monobank status maps to exactly one value; an unknown status fails the parse
    loudly.
  - **`Currency` is a clean rename, not an alias.** `ProductCurrency` becomes `Currency` in
    `packages/contracts/src/common/currency.ts`; every consumer is renamed; no re-export
    under the old name survives (the owner: an alias kept "so as not to touch B" is the
    wrong reason; touch everything for cleanliness).
  - **The token cipher is generalized and the mobile-publish instance moves next to its
    consumers.** `utils/token-cipher.ts` exports a factory and reads no env; the
    mobile-publish instance lives in `endpoints/coaching/mobile-publish/`; the billing
    instance lives in `endpoints/billing/`. This is the one cross-context touch of the
    step and it is imports only.
  - **Transport is your call at the plan gate**, `ApiClient` or a thin `fetch` helper —
    with the consequence named: `ApiClient` drops Monobank's `errCode` / `errText` unless
    `parseErrorResponse` learns to keep a non-envelope body in `details`, and adds an
    `Idempotency-Key` header Monobank ignores. The behaviours below hold either way.
  - **No retries on any write.** A retried `wallet/payment` is a second charge; a retried
    `invoice/create` is a second invoice. `POST` and `DELETE` run once. `GET` (`fetchPurchase`,
    the public key) may retry twice on 429 / 5xx / transport failure with backoff. 10 s per
    attempt.

## Deliverable 1 — env modules

`packages/env/src/monobank.ts` → `monobankEnv`:

- `MONOBANK_API_URL`: `z.string().url().default("https://api.monobank.ua")`.
- `MONOBANK_MERCHANT_TOKEN`: `z.string().min(1)` — the `X-Token`; a personal token from
  `api.monobank.ua` in dev and preview, Denys's merchant token in production at P4.2.
- `MONOBANK_WEBHOOK_PUBLIC_KEY`: `z.string().optional()` — the base64 value `GET /pubkey`
  returns. Unset: the adapter fetches and caches the key. Set: no fetch (tests, air-gapped
  local runs).

`packages/env/src/billing.ts` → `billingEnv`:

- `BILLING_ENCRYPTION_KEY`: `z.string().length(44)` — base64 of 32 random bytes, the same
  shape as `MOBILE_PUBLISH_ENCRYPTION_KEY`; generated with `openssl rand -base64 32`.

Register, verbatim state in the plan: `packages/env/package.json` `exports` (`./monobank`,
`./billing`); `turbo.json` `globalEnv` (the four names); `.env.example` (a `Monobank
acquiring` block and a `Billing` block with the `openssl` hint, placeholder values only);
`README.md` § Environment Variables (platform rows); `docs/DEPLOY.md` § Required variables
and § Per-app env usage (platform); `packages/api-server/vitest.config.ts` `test.env`
(`BILLING_ENCRYPTION_KEY` with a test-only 44-character value distinct from the mobile one;
no Monobank values — the adapter is constructed with explicit config in tests). No app
imports either module in this step.

## Deliverable 2 — the payment port

`packages/api-server/src/infrastructure/payment/port.ts` — types only, zero vendor
knowledge, the Stripe-era shapes (`CreateCheckoutInput`, `sessionId`, the synchronous
boolean `verifyWebhook`) deleted. The shape, to be brought to the plan gate in full
TypeScript:

- `Currency` from `@repo/contracts/common`.
- `BasketLine = { name: string; code: string }` (qty 1, `sum` = `total` = the amount).
- `CreatePurchaseInput = { amountCents; currency; reference; description; basketLine; redirectUrl; webhookUrl; validitySeconds?; storeCard: { walletId: string } | null }`
  → `CreatePurchaseResult = { providerRef: string; redirectUrl: string }` (`invoiceId`,
  `pageUrl`). `reference` is our purchase id, echoed by Monobank in every status and
  webhook (`merchantPaymInfo.reference`); `description` is `destination`.
- `ChargeStoredCardInput = { cardToken; amountCents; currency; reference; description; basketLine; webhookUrl }`
  → `ChargeOutcome = { providerRef; status; challengeUrl: string | null; modifiedAt: Date }`.
  A decline or a `processing` reply is an outcome, never an exception.
- `PurchaseStatus`: a closed union in our words covering Monobank's seven
  (`created · processing · hold · success · failure · reversed · expired`), one to one.
- `PurchaseState = { providerRef; status; amountCents; currency; reference: string | null; createdAt: Date; modifiedAt: Date; storedCard: { cardToken; walletId; maskedPan; paymentSystem; status: "new" | "created" | "failed" } | null; paidWith: { maskedPan; paymentSystem } | null }`
  — the same shape for `fetchPurchase` and `parseWebhook`, because the webhook body is the
  invoice status body.
- `PaymentPort = { createPurchase; chargeStoredCard; fetchPurchase(providerRef); forgetStoredCard(cardToken); verifyWebhook({ rawBody: string; signature: string }): Promise<boolean>; parseWebhook(rawBody: string): PurchaseState }`.
  `verifyWebhook` is asynchronous because the key may be fetched. `parseWebhook` throws
  (a typed error, not a zod error) on a body that is not an invoice.

`index.ts` re-exports the port types and the adapter factory and exposes
`defaultPayment = createMonobankAdapter({ apiUrl: monobankEnv.MONOBANK_API_URL, merchantToken: monobankEnv.MONOBANK_MERCHANT_TOKEN, webhookPublicKey: monobankEnv.MONOBANK_WEBHOOK_PUBLIC_KEY })`
— the only file that reads `monobankEnv`. Nothing imports `index.ts` in this step.

## Deliverable 3 — the Monobank adapter

Files under `infrastructure/payment/`: the adapter (`monobank-adapter.ts`), its wire
schemas (`monobank-wire.ts`: zod schemas of the request bodies and responses above, the
`ccy` map, the status map, the date parser), the signature verifier (`monobank-signature.ts`
or inside the adapter — your layout, one file family named `monobank-*`), `__fixtures__/`,
and the tests. Behaviours:

- `createMonobankAdapter(config: { apiUrl; merchantToken; webhookPublicKey?: string; fetch?: typeof fetch })`
  returns a `PaymentPort`. Config is explicit so the tests build it without env.
- `X-Token` on every call; JSON bodies; `paymentType: "debit"` and `ccy` from the map on
  every invoice and charge; `merchantPaymInfo` built from `reference`, `description` and
  the basket line; `saveCardData: { saveCard: true, walletId }` exactly when `storeCard`
  is given and never any other key; `initiationKind: "merchant"` on every charge.
- Error mapping: a 4xx from Monobank → `InternalServerError("monobank rejected the request", { path, status, errCode, errText })`
  (our payload or our configuration is wrong; a Monobank 401 never reaches a client as a
  401); 5xx and transport failures → `BadGatewayError`; an abort → `TimeoutError`. The
  merchant token, the request body and any card token never enter an error's details or
  message.
- `fetchPurchase` and `parseWebhook` share one parser from the wire body to `PurchaseState`.
- The signing key: from `config.webhookPublicKey` when given; otherwise fetched once from
  `GET /api/merchant/pubkey`, decoded from base64 to PEM (accept a value that already
  decodes to `-----BEGIN…`, wrap a bare base64 body otherwise), cached in the adapter
  instance; on a failed verification with a fetched key, refetch ONCE and verify again;
  return `false` after that. A malformed signature (not base64, wrong length) returns
  `false`; a malformed key throws, because that is a configuration error.
- `forgetStoredCard` sends `DELETE /api/merchant/wallet/card?cardToken=…` and accepts any
  2xx with any body; the README names it as unverified by execution (SB-38).

Fixtures: the three webhook captures and the public key as JSON, copied as described above.

Tests (`monobank-adapter.test.ts`, a fetch spy as in `legacy-mobile/rest-adapter.test.ts`;
split by file if one file grows past the lint rules): for each method the URL, the method,
the `X-Token` header and the exact JSON body (`ccy: 980` for UAH, the basket line with
`qty: 1` and `sum === total === amount`, `saveCardData` present with `storeCard` and absent
without it, `allowTokenizationChoice` never present, `initiationKind: "merchant"`); a `POST`
that meets a 503 is sent exactly once and surfaces `BadGatewayError`; a `GET` that meets a
503 twice and then 200 succeeds after three calls; a 400 with `{ errCode, errText }`
surfaces `InternalServerError` with both in `details` and without the token; an abort
surfaces `TimeoutError`; both date formats parse; all seven statuses map; an unknown status
throws; the synchronous charge reply with `tdsUrl` becomes an outcome with `challengeUrl`;
`parseWebhook` on each fixture; `verifyWebhook` on the `success` fixture is `true`, with
one byte of `rawBody` changed is `false`, with `JSON.stringify(JSON.parse(rawBody))` is
`false`, with a pinned key makes no fetch, with a fetched key fetches once for two
verifications, refetches exactly once on a failure, and returns `false` on a malformed
signature. Mock timers for the backoff as the legacy test does.

Dep-cruiser: one new rule, `api-server-payment-vendor-is-private`: nothing outside
`packages/api-server/src/infrastructure/payment/` may import a file matching
`infrastructure/payment/monobank`. Consumers import the port from the directory's barrel.

## Deliverable 4 — contracts and mappers

**`Currency`.** `packages/contracts/src/common/currency.ts`: `export enum Currency { USD =
"USD", EUR = "EUR", UAH = "UAH" }`; registered in `common/index.ts`. `ProductCurrency` is
deleted; every consumer in the inventory above imports `Currency` from
`@repo/contracts/common` (admin files: the enum, `getCurrencySymbol`'s parameter type, the
fixtures and tests). `moneySchema` in `common/money.ts` keeps its string currency; name at
the plan gate whether any consumer would rather have the enum, do not change it unasked.

**Billing entities**, each a directory under `packages/contracts/src/entities/billing/` with
`*.constants.ts` (enums), `*.schema.ts`, `*.types.ts`, `index.ts`, and a `package.json`
export (`./billing/subscription`, `./billing/transaction`, `./billing/product-plan`),
mirroring `cms/product`:

- `subscription/`: `BillingProvider { MONOBANK, MANUAL, FREE }`, `SubscriptionStatus { ACTIVE, PAST_DUE, CANCELED, EXPIRED }`;
  `subscriptionSchema = { id, userId, productId, priceId: nullable, provider, status, autoRenew, currentPeriodStart, currentPeriodEnd, graceEndsAt: nullable, canceledAt: nullable, endedAt: nullable, createdAt, updatedAt }`.
  **No `cardToken`, no `providerSubscriptionId`.** A test asserts
  `Object.keys(subscriptionSchema.shape)` contains neither.
- `transaction/`: `TransactionKind { INITIAL, RENEWAL, ONE_OFF, REFUND }`, `TransactionStatus { PENDING, SUCCEEDED, FAILED }`;
  `transactionSchema = { id, userId, subscriptionId: nullable, provider, kind, amountCents, currency, status, providerTxId, periodStart: nullable, periodEnd: nullable, createdAt }`.
  No `idempotencyKey`.
- `product-plan/`: `PlanDelivery { JOIN, COPY }`; `productPlanSchema = { id, productId, planId, delivery, createdAt, updatedAt }`.

Enums are TS string enums parsed with `z.nativeEnum`, ids are `z.string().cuid()`, dates are
`z.date()`, money is an integer — the `cms/product` conventions. Schema tests in the
`product.schema.test.ts` style: a valid row parses, each enum rejects a value outside it,
the nullable fields accept `null`.

**Mappers**, `packages/api-server/src/mappers/billing/{enum-maps.ts,subscription.mapper.ts,transaction.mapper.ts,product-plan.mapper.ts,index.ts}`
in the `cms` style: `Record<PrismaEnum, ContractEnum>` maps (their exhaustiveness IS the
parity check with `schema.prisma`), `mapToSubscription`, `mapToTransaction`,
`mapToProductPlan`. `CURRENCY_MAP` moves out of `mappers/cms/enum-maps.ts` into a
context-free home, `packages/api-server/src/mappers/common/currency.ts`, imported by the cms
and the billing maps (`mappers/billing` may not import `mappers/cms`: rule
`api-server-billing-no-cms-coaching`). Mapper tests are pure (a Prisma-typed row literal,
no database): the output of `mapToSubscription` has no `cardToken` and no
`providerSubscriptionId` key (`toHaveProperty` negated), every enum value maps.

## Deliverable 5 — the card-token cipher (D-20)

- `packages/api-server/src/utils/token-cipher.ts` becomes
  `createTokenCipher({ key, name }): { encrypt(plaintext): string; decrypt(payload): string }`
  — AES-256-GCM, 12-byte IV, 16-byte tag, base64 wire, exactly what it does today; the
  factory throws at construction when `key` does not decode to 32 bytes, naming `name` in
  the message. It reads no env. `utils/index.ts` keeps exporting it. `token-cipher.test.ts`
  tests the factory (the same cases as today, plus the construction failure).
- `packages/api-server/src/endpoints/coaching/mobile-publish/legacy-token-cipher.ts` builds
  the mobile-publish instance from `mobilePublishEnv.MOBILE_PUBLISH_ENCRYPTION_KEY` and
  exports `encryptLegacyToken` / `decryptLegacyToken`; the four consumers
  (`athletes.ts`, `connections.ts`, `publish.ts`, `training-levels.ts`) and their tests
  switch to it; `infrastructure/legacy-mobile/README.md` "No token storage / cipher" names
  the new file. Behaviour unchanged: the suite's connection tests pass without edits to
  their assertions.
- `packages/api-server/src/endpoints/billing/card-token-cipher.ts` builds the billing
  instance from `billingEnv.BILLING_ENCRYPTION_KEY` and exports `encryptCardToken` /
  `decryptCardToken`. Tests: round trip, distinct ciphertexts for one plaintext, a tampered
  byte throws, the ciphertext does not contain the plaintext.

Side effect to name in the PR body, not to claim as a fix: after this the `utils` barrel no
longer validates `MOBILE_PUBLISH_ENCRYPTION_KEY` at import (half of SB-27's cause).

## Deliverable 6 — documents

- `infrastructure/payment/README.md` rewritten for the Monobank seam: why the port has this
  shape, the method table with the Monobank call behind each, the raw-bytes law, the
  retry policy, the error mapping, the key cache and rotation, what is deliberately not
  wrapped, the unverified `DELETE wallet/card` (SB-38), and the rule that consumers inject
  the port through a factory and tests never import `index.ts`.
- `infrastructure/README.md`: the `payment` row → Live, default adapter `monobank`.
- `packages/contracts/src/entities/billing/README.md`: what is here now, the no-`cardToken`
  rule pinned by a test, where the price stays (`cms/product`, until 3.1).
- `packages/api-server/src/endpoints/billing/README.md`: the 0.5 paragraph rewritten (the
  port and adapter exist; the cipher and the D-20 rules for 1.2: redaction after
  verification, a replayed ledger event never writes `cardToken`, no raw error text).
- `docs/BOUNDED-CONTEXTS.md` §5 "Where it lives today" (contracts, API) and the card-token
  invariant bullet (D-20 replaces the "plain text" sentence).
- `README.md`, `docs/DEPLOY.md`, `.env.example` as in deliverable 1.

## Scope fence

- **Touch:** `packages/env/{package.json,src/monobank.ts,src/billing.ts}`; `turbo.json`
  (`globalEnv` only); `.env.example`; `README.md`; `docs/DEPLOY.md`; `docs/BOUNDED-CONTEXTS.md`;
  `.dependency-cruiser.cjs` (one rule); `packages/api-server/src/infrastructure/{payment/**,README.md,legacy-mobile/README.md}`;
  `packages/api-server/src/utils/token-cipher{.ts,.test.ts}`;
  `packages/api-server/src/endpoints/coaching/mobile-publish/**` (the cipher instance and
  imports only); `packages/api-server/src/endpoints/billing/{README.md,card-token-cipher.ts,card-token-cipher.test.ts}`;
  `packages/api-server/src/mappers/{billing/**,common/**,cms/enum-maps.ts,cms/product.mapper.ts}`;
  `packages/api-server/vitest.config.ts` (`test.env` only); `packages/contracts/{package.json,src/common/**,src/entities/billing/**,src/entities/cms/product/**}`;
  the `ProductCurrency` rename sites in `apps/admin/src/modules/products/**` and
  `packages/api-server/src/endpoints/cms/**` tests.
- **Do NOT touch:** `packages/api-server/prisma/**`, `src/authz/**`, `src/db/**`,
  `endpoints/{lms,iam,mobile-compat,ops,storage}/**`, endpoint logic under
  `endpoints/cms/**` (rename sites in tests only), every route handler under `apps/*/src/app/`,
  `apps/platform/next.config.ts`, `apps/marketing/**`, `.github/**`, lockfiles,
  `initiatives/**`, `CLAUDE.md`, `docker-compose.yml`, `taskfile.dist.yml`, any `.env*`
  file except `.env.example`. No new dependency, no new api-server export subpath.
- **Not in this step:** billing endpoints and the state machine (1.1), the webhook route
  and ledger (1.2), the cron (1.3), checkout (2.1), `GET wallet`, refunds, `paymentMethods`,
  native subscriptions, dropping the dead columns (0.3b).
- **Secrets.** Never read `apps/*/.env.local`, `packages/api-server/.env` or any `.env*`
  besides `.env.example`; never print an env value; you need no Monobank token — the tests
  run on a fetch spy, the live smoke is the planner's.

## Sacred (charter)

The iOS wire contract · prod data additive-only · athlete navigation stays free ·
dep-cruiser context rules (LMS, Coaching and the mobile shim stay Billing-blind; CMS
contracts must not import Billing contracts, Billing must not import CMS or Coaching) ·
migrations through `prisma migrate` (none in this step).

## Acceptance gates (verify yourself before the PR)

- `pnpm --filter @repo/contracts test`; `task test:api TDP_DB_PORT=<your port>` green in
  your throwaway container (D-19: the shared stack is never yours); the admin project
  (`pnpm exec vitest run --project admin`, fenced) green.
- `pnpm check-types`, `pnpm lint`, `pnpm dep:check`, `pnpm format:check` clean; the
  platform app builds (fenced, `NODE_OPTIONS=--max-old-space-size=3072`).
- Grep gates: `ProductCurrency` — no hit anywhere; `createCheckout|CreateCheckoutInput|VerifyWebhookInput|sessionId`
  — no hit under `infrastructure/payment/`; `allowTokenizationChoice` — hits only in the
  README and in a test asserting its absence; `cardToken` — no hit under
  `packages/contracts/`; `MONOBANK_MERCHANT_TOKEN|BILLING_ENCRYPTION_KEY` — hits only in the
  env modules, `turbo.json`, `.env.example`, README, DEPLOY, `vitest.config.ts`, the
  cipher file and the documents, never with a real value.
- Every new test shown to fail under at least one mutant of the code it pins (name three
  in the PR body: a `POST` that retries, a verification over re-serialized JSON, a cipher
  reading the wrong key).
- The PR contains no file under `initiatives/` and no `CLAUDE.md`.
- PR body per the PR-body law, with the checklist AS CHECKBOXES. There is no browser
  gate; the checklist carries what execution has and has not proven:
  - [ ] planner: live smoke against Monobank's test API through the adapter (`details`
        is not on the port; `pubkey` fetch and `verifyWebhook` on the captured fixture,
        `createPurchase` → `fetchPurchase` → the invoice removed with the spike tool)
  - [ ] planner: `MONOBANK_API_URL`, `MONOBANK_MERCHANT_TOKEN`, `BILLING_ENCRYPTION_KEY` in
        the platform Vercel project (preview + production) and in the local env files —
        needed before 1.1, delegated by the owner
  - [ ] `forgetStoredCard` (`DELETE wallet/card`) against a tokenized card — deferred to the
        manual sandbox payment pass (SB-38)

## Standing constraints

- The repository is PUBLIC: no secrets, no athlete data, no production rows in any
  committed file; synthetic fixtures only.
- No comments in code; delete comments in regions you edit.
- Commitlint: lowercase subject, body lines at most 100 characters, long bodies through
  `git commit -F`; never `--no-verify`; no signatures or attribution lines anywhere.
- Branch `feat/storefront-billing-monobank-seam` from `main`; one PR against `main`; the
  repository squash-merges, so never stack this branch on another.
- Commit at safe increments BEFORE spawning any subagent and re-verify file presence
  after every subagent round; nothing of value sits uncommitted while a subagent may be
  alive.
- Capped run: at most ONE internal subagent alive at a time; no parallel fan-out; stages
  strictly sequential.
- Resource fence (WSL): every heavy command inside `systemd-run --user --scope -q
--slice=heavy.slice -p MemoryMax=4G -p MemorySwapMax=1G -- <cmd>`, builds with
  `NODE_OPTIONS=--max-old-space-size=3072` in the caller's environment, vitest
  `--maxWorkers=2`, turbo `--concurrency=2`, one heavy command at a time.
- Databases: your own throwaway container (D-19, `postgres:17-alpine`, `--memory=512m`, a
  free port, the stack's init directory mounted; `task stack:migrate TDP_DB_PORT=<port>`
  then `task test:api TDP_DB_PORT=<port>`); the shared stack (`tdp`, `tdp_test`,
  `tdp_shadow`, `prod_snap`) and every other container on the host are not yours.
- End every turn declaring where you left the tree (branch, clean or dirty, last commit).

## Plan-gate report

Bring, each with your recommendation and never as an option list: the port in full
TypeScript; the transport choice and its error-body consequence; the wire-schema file layout
and the status table; the key-cache design; the `Currency` sweep — every consumer the (f)
pass found beyond the inventory above; the home and name of the shared currency map; the
cipher factory's signature and the two instance files; whether anything you add is
validated at build time (expected: nothing); anything in this file the tree contradicts.

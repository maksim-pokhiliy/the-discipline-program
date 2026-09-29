# Payment port

Monobank internet acquiring behind a provider-agnostic port: invoices on Monobank's hosted payment page that can store the buyer's card, merchant-initiated charges on a stored card, invoice status reads, removal of a stored card, and the verification and parsing of Monobank's webhooks.

## Why a port, and why this shape

ADR-0044 (D-1) keeps Monobank out of the billing core. The subscription state machine (storefront-billing 1.1), the webhook ledger (1.2) and the renewal cron (1.3) call `PaymentPort`; only the `monobank-*` files of this directory know Monobank's URLs, payloads and signature scheme. D-3 (b) sets what the port has to carry: the platform runs its own renewals, so the first payment tokenizes the card and every later period is a merchant-initiated charge on that token. Monobank's native subscriptions are not used.

- **Our vocabulary.** The port says `providerRef` for Monobank's invoice id, `amountCents` and a `Currency` from `@repo/contracts/common` for `amount` and the numeric `ccy`, `description` for `destination`, `storeCard` for `saveCardData` and `challengeUrl` for `tdsUrl`. Statuses are closed unions of our own words. Every Monobank status maps to exactly one of them, and a status the adapter does not know fails the parse instead of slipping through.
- **Plain records.** Inputs and results are plain objects, never Prisma rows, so the core decides what goes in: `reference` is our purchase id, which Monobank echoes in every status reply and webhook, and the wallet id is the platform `userId` (D-17 as amended by D-20).
- **Verification and parsing are separate calls.** `verifyWebhook` only answers whether the bytes are Monobank's; `parseWebhook` reads them. 1.2 keeps verified bodies in its ledger and may read one again later. A stored body was verified when it arrived and is never verified again (D-20), so parsing cannot demand a verification in the same call.
- **`verifyWebhook` is asynchronous** because the signing key may have to be fetched from Monobank first.
- **One result for a status read and a webhook.** A webhook body is the invoice status body with no envelope, so `fetchPurchase` and `parseWebhook` share one parser and return the same `PurchaseState`.
- **A 200 is an outcome.** A charge that Monobank answers with a 200 comes back as a `ChargeOutcome`, whether it succeeded, was declined or asked for 3-D Secure. Everything else is an error (see "Transport").

## Shape

| Method                                  | Monobank call                                                 | Reply                                                                    | Notes                                                                                                                                                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createPurchase(input)`                 | `POST /api/merchant/invoice/create`                           | `{ invoiceId, pageUrl }` becomes `{ providerRef, redirectUrl }`          | `input.redirectUrl` is where Monobank sends the buyer back after paying; the result's `redirectUrl` is the hosted payment page to send the buyer to. `storeCard: { walletId }` asks Monobank to tokenize the card; `null` sells without storing it. |
| `chargeStoredCard(input)`               | `POST /api/merchant/wallet/payment`                           | `{ invoiceId, status, modifiedDate, tdsUrl? }` becomes a `ChargeOutcome` | A merchant-initiated debit on `input.cardToken`. `challengeUrl` is the `tdsUrl`, or `null`.                                                                                                                                                         |
| `fetchPurchase(providerRef)`            | `GET /api/merchant/invoice/status?invoiceId=…`                | the invoice body becomes a `PurchaseState`                               | Retried on a transient failure, like every GET.                                                                                                                                                                                                     |
| `forgetStoredCard(cardToken)`           | `DELETE /api/merchant/wallet/card?cardToken=…`                | any 2xx, body ignored                                                    | Unverified by execution (SB-38, see "Unverified").                                                                                                                                                                                                  |
| `verifyWebhook({ rawBody, signature })` | `GET /api/merchant/pubkey`, only for a key that is not pinned | `{ key }`                                                                | `true` or `false`; throws when the key cannot be obtained.                                                                                                                                                                                          |
| `parseWebhook(rawBody)`                 | none                                                          | the invoice body becomes a `PurchaseState`                               | Synchronous; throws `BadGatewayError` on a body it cannot read.                                                                                                                                                                                     |

Every request carries the merchant token in `X-Token`, plus `Content-Type: application/json` when it has a body, and no other header: there is no `Idempotency-Key`, which Monobank ignores. Requests go out with `redirect: "error"`, so the token never follows a redirect, and `cache: "no-store"`, so a status read is never served from a fetch cache. The card token of `DELETE wallet/card` is URL-encoded in the query.

Both writes carry `paymentType: "debit"`, the `ccy` of the input's currency and `merchantPaymInfo` with our `reference`, the `description` as `destination` and the one-line basket of D-10: `[{ name, qty: 1, sum, total, unit: "шт.", code }]`, with `sum` and `total` equal to the amount and `name` and `code` taken from `basketLine`. An invoice adds `redirectUrl` and `webHookUrl`, `validity` only when `validitySeconds` is given, and `saveCardData: { saveCard: true, walletId }` exactly when `storeCard` is given, with no other key inside it. A charge adds `cardToken`, `initiationKind: "merchant"` and `webHookUrl`, and never a `redirectUrl` or `saveCardData`. Before a write is sent, its body is checked against a strict schema of the wire shape; a body that fails (a fractional or non-positive amount; an empty reference, description, basket name or code, wallet id or card token; a return or webhook URL that is not a URL; a key the schema does not know) is never sent. Monobank ignores a request field it does not know without an error, so a 200 never proves that a field was understood.

### Statuses

| Monobank `status` | Meaning                                                               | `PurchaseStatus`   |
| ----------------- | --------------------------------------------------------------------- | ------------------ |
| `created`         | invoice issued, not paid                                              | `AWAITING_PAYMENT` |
| `processing`      | payment in progress; the first webhook of a merchant-initiated charge | `PROCESSING`       |
| `hold`            | funds held (`paymentType: "hold"`, which we never send)               | `HELD`             |
| `success`         | paid                                                                  | `SUCCEEDED`        |
| `failure`         | declined or failed                                                    | `FAILED`           |
| `reversed`        | refunded through `invoice/cancel`                                     | `REFUNDED`         |
| `expired`         | the invoice's validity ran out unpaid                                 | `EXPIRED`          |

The map is one to one and closed: any other status fails the parse. `ChargeOutcome.status` uses the same map.

### Currencies and dates

`amount` is in minor units and `ccy` is the numeric ISO 4217 code: `980` is `UAH`, `840` is `USD`, `978` is `EUR`. Requests take the code of the input's `Currency` (the map covers every value of the enum); a reply or a webhook with any other code fails the parse. Only `980` has been on the wire so far (SB-2, see "Unverified").

Dates are read in both forms Monobank sends: `2026-09-25T10:55:41Z` in invoice bodies and `2026-09-25T14:23:28.764528+03:00` in the synchronous charge reply. A date alone, a space instead of the `T` or a number fails the parse.

### Stored card and paying card

`walletData` comes only with an invoice that asked to store the card (none of the captured charges carries it). `PurchaseState.storedCard` is a union on its status:

| `walletData.status` | `StoredCard.status` | `cardToken`                                                        |
| ------------------- | ------------------- | ------------------------------------------------------------------ |
| `new`               | `PENDING`           | the token, or `null`                                               |
| `created`           | `STORED`            | always present: a `created` wallet without a token fails the parse |
| `failed`            | `FAILED`            | the token, or `null`                                               |

`maskedPan` and `paymentSystem` are `null` when Monobank leaves them out. `paidWith` is `{ maskedPan, paymentSystem }` from `paymentInfo` when both are present, and `null` otherwise. A missing `reference` reads as `null`. Top-level fields the parser does not read, such as `finalAmount`, `payMethod` or `cancelList`, are ignored, and so is any field Monobank adds later.

### 3-D Secure on a charge

`initiationKind: "merchant"` never returned a `tdsUrl` in test mode: every charge came back as a synchronous `success`. If a charge does come back `processing` with a `tdsUrl`, `chargeStoredCard` returns a `PROCESSING` outcome with its `challengeUrl`, and per D-3 the core treats it as a failed renewal, not a redirect.

## Webhooks: verify the raw bytes

Monobank posts the invoice body as JSON and signs it: the `x-sign` header is a base64 ECDSA signature (P-256, SHA-256) over the raw request body. **The route verifies the bytes as it received them.** It reads `await request.text()` once, passes that string as `rawBody` and the `x-sign` header as `signature` to `verifyWebhook`, and only after a `true` passes the same string to `parseWebhook`. A missing header passed as `""` verifies `false`. Never verify a re-serialized object: two of the three captured bodies (`processing`, `success`) stop verifying after `JSON.stringify(JSON.parse(rawBody))`, while the third (`created`) comes back byte-identical and still verifies. A re-serialized body may verify by accident, and that proves nothing.

The route must run on the Node runtime, because the verifier uses `node:crypto`. What it answers for a `false` or for a body it cannot parse is 1.2's call; Monobank retries a delivery that does not get a 200, up to three times.

What the captures show about delivery: an invoice fires `created` as soon as it is issued; a merchant-initiated charge fires `processing` (with `finalAmount: 0`) and then `success`, about 50 ms apart; an unpaid invoice that expires fires nothing, so expiry is only seen through `fetchPurchase`. The `processing` and `success` webhooks of one charge can carry the same second-precision `modifiedDate` (the captures do), so ordering by `modifiedDate` alone cannot rank them: 1.2 needs a status-rank tie-break and must never move `SUCCEEDED` back to `PROCESSING`.

## Transport: retries, timeouts, errors

`monobank-http.ts` is a thin `fetch` helper, not `@repo/api-client`: `ApiClient` retries by status for every method, drops Monobank's `{ errCode, errText }` error body, and puts the full URL into the details of every error it builds, which for `DELETE wallet/card` would carry the card token into the logs.

- **Writes are sent exactly once.** `createPurchase`, `chargeStoredCard` (POST) and `forgetStoredCard` (DELETE) make one attempt whatever happens: a retried `wallet/payment` is a second charge, and a retried `invoice/create` is a second invoice.
- **Reads retry.** `fetchPurchase` and the key fetch (GET) make up to three attempts. A retry follows a 429, any 5xx, a timeout or a transport failure, after a backoff of 1–2 s and then 2–3 s. Any other 4xx is final at once.
- **10 s per attempt**, covering the response body as well as the headers. A read whose three attempts all time out takes about 35 s, which matters for the function durations of 1.2 and 1.3.

| Situation                                                                                                                                       | Error (status)              | Message                                                                                                                                                                                                                                                                | `details`                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| An outgoing body fails its strict schema; nothing is sent                                                                                       | `InternalServerError` (500) | `monobank request is invalid`                                                                                                                                                                                                                                          | `{ path, issues }`                   |
| Monobank answers a 4xx other than 429                                                                                                           | `InternalServerError` (500) | `monobank rejected the request`                                                                                                                                                                                                                                        | `{ path, status, errCode, errText }` |
| Monobank answers a 429 or a 5xx                                                                                                                 | `BadGatewayError` (502)     | `monobank failed the request`                                                                                                                                                                                                                                          | `{ path, status, errCode, errText }` |
| `fetch` rejects (network, DNS, a redirect)                                                                                                      | `BadGatewayError` (502)     | `monobank could not be reached`                                                                                                                                                                                                                                        | `{ path }`                           |
| An attempt runs past 10 s                                                                                                                       | `TimeoutError` (504)        | `monobank did not answer in time`                                                                                                                                                                                                                                      | `{ path, timeoutMs: 10000 }`         |
| A 2xx reply, a webhook body or the key reply is not JSON or does not match its schema (an unknown status or `ccy`, a bad date, a missing field) | `BadGatewayError` (502)     | `monobank sent an invoice we cannot read` (a status reply or a webhook), `monobank sent an invoice reply we cannot read` (`invoice/create`), `monobank sent a charge reply we cannot read` (`wallet/payment`), `monobank sent a webhook key we cannot read` (`pubkey`) | `{ issues }`                         |
| The fetched key is not an EC public key                                                                                                         | `BadGatewayError` (502)     | `monobank sent a webhook key we cannot read`                                                                                                                                                                                                                           | `{ path }`                           |
| A pinned key is not a base64-encoded EC public key, at construction                                                                             | `InternalServerError` (500) | `monobank webhook public key is not a base64-encoded EC public key`                                                                                                                                                                                                    | none                                 |

`path` is the constant API path (`/api/merchant/wallet/card`), never the URL: no error carries a URL, a query, a header or a request body. `errCode` and `errText` come from Monobank's `{ errCode, errText }` error body and are `null` when the body has another shape; the merchant token and the call's card token are replaced with `[REDACTED]` in both, because Monobank echoes request values in `errText`. `issues` is a list of `{ path, code }`: zod paths and codes only, never the offending value, zod's message or the body. A 4xx is treated as our payload or our configuration being wrong (on a charge it may also be a rejected token, see "A declined charge"), so a Monobank 401 reaches a client as a 500, never as a 401. The adapter does not log; its errors go up to the route boundary.

## Outcomes that stay unknown

A write whose reply never arrived, or arrived unreadable, may still have happened. After any of these the outcome is unknown:

- a `TimeoutError` or a `BadGatewayError` from `createPurchase` or `chargeStoredCard`, including a 200 reply the adapter cannot read;
- an `InternalServerError` from a 4xx on `chargeStoredCard` (see "A declined charge" below).

The core never retries such a write blindly. It recovers from the webhook, which echoes our `reference`: the port has no lookup by `reference`, and `fetchPurchase` needs the invoice id that the lost reply would have carried. The one write error with a known outcome is `monobank request is invalid`, because the body failed our own check and was never sent.

**A declined charge.** The decline shape of a merchant-initiated charge is unverified (SB-1 item 6): test mode offered no way to make a charge decline. A 200 with `status: "failure"` is a `FAILED` outcome. A 4xx may be a rejected token or our own bad payload, and moving a subscription to `PAST_DUE` on our bug is wrong, so 1.3 decides the mapping after a test-mode observation or the first production decline; until then a 4xx on a charge is an `InternalServerError` and the outcome of the charge is unknown.

## The webhook signing key

**Pinned.** A non-empty `MONOBANK_WEBHOOK_PUBLIC_KEY` (`webhookPublicKey` in the adapter config) pins the key. It takes the value `GET /api/merchant/pubkey` returns, the base64 of the PEM text; a bare base64 key body without the PEM armour works too. The adapter decodes it when it is built and requires an EC public key, so a malformed or non-EC value throws `InternalServerError` at construction, not on the first webhook. A pinned key is never fetched and never refetched, and an empty value counts as unset. Pinning is for tests and air-gapped local runs; deployments leave the variable unset.

**Fetched.** Without a pinned key, the adapter fetches the key on the first verification, decodes it the same way and caches it in the adapter instance, so each server instance's `defaultPayment` holds its own copy. Verifications that start together on a cold instance share one fetch. The fetch is a GET like any other, retries included.

**Refetch on a failed verification.** When a signature does not verify against a fetched key, the adapter refetches once, verifies again with the fresh key and returns that answer, but only if the last key fetch started at least 60 s ago or is still running, in which case the call joins it. Otherwise it answers `false` without a fetch. That is how a key rotation heals: a webhook signed with the new key fails against the old one, and once the last fetch is a minute old, that failure brings the new key in. The same bound holds forged signatures to one refetch per minute per instance.

**A key that cannot be fetched.** When Monobank cannot be reached, answers a 4xx (a wrong `X-Token`, say) or sends something that is not an EC key, `verifyWebhook` throws the typed error of the table above instead of answering `false`, so an outage does not pass for a forgery: the route answers with a 5xx and Monobank retries. A failed refetch keeps the cached key; a failed first fetch caches nothing, and the next verification fetches again.

**A malformed signature** answers `false` before any key work and never triggers a fetch. A signature must be strict standard base64 (the URL-safe alphabet is refused) with a length that is a multiple of four, and decode to 8 to 72 bytes that open a DER `SEQUENCE` of the matching length.

## Unverified

- **The decline shape** of a merchant-initiated charge (SB-1 item 6), described above.
- **`DELETE wallet/card`** (SB-38). `forgetStoredCard` is built from the documented endpoint table in `initiatives/storefront-billing/monobank-notes.md`, and no capture of the call exists; it accepts any 2xx with any body. What Monobank answers for a token it no longer holds is unknown as well: a 404 there would surface as `InternalServerError`, like any 4xx.
- **Invoices in another currency than UAH** (SB-2). The `ccy` map covers USD and EUR, but whether a FOP terminal accepts them is unconfirmed.
- **`walletData` in the `new` and `failed` states** is documented but was never captured; the stored-card union covers the documented shape.

## Not wrapped

These are deliberately left off the port; a later step adds one when a consumer needs it.

- `GET /api/merchant/wallet?walletId=` (the stored cards of a wallet).
- `invoice/cancel` (a refund) and `invoice/remove`.
- `subscription/*`: D-3 chose the platform's own renewals over Monobank's native subscriptions.
- `paymentMethods` on the invoice. The lever exists (`apple`, `google`, `mono`, `monopay`, `pan`) for when D-3's production check of the wallet channels needs it.
- `allowTokenizationChoice`, which is never sent: the hosted page would show a toggle the athlete can switch off, and an auto-renew subscription would be left without a token.
- `initiationKind: "client"` (a charge the buyer confirms with 3-D Secure), `paymentType: "hold"`, and `GET /api/merchant/details`.

## Files and wiring

| File                                                            | What it does                                                                                                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `port.ts`                                                       | `PaymentPort` and every type on it; types only, no Monobank word                                                                                                   |
| `index.ts`                                                      | re-exports the port types, `createMonobankAdapter` and `MonobankAdapterConfig`, and builds `defaultPayment`                                                        |
| `monobank-adapter.ts`                                           | `createMonobankAdapter(config)`: builds the request bodies (the D-10 basket, the D-3 (b) flags), checks them, sends them, reads the replies, wires the verifier    |
| `monobank-http.ts`                                              | the transport: URL, `X-Token`, JSON, 10 s per attempt, retries for GETs only, the error mapping, secret scrubbing                                                  |
| `monobank-wire.ts`                                              | Monobank's vocabulary: API paths, strict request schemas, tolerant reply and webhook schemas, the date schema, the `ccy` and status maps                           |
| `monobank-parse.ts`                                             | turns reply and webhook text into port shapes or one typed error, and checks outgoing bodies                                                                       |
| `monobank-signature.ts`                                         | key decoding and caching, the signature pre-check, ECDSA over the raw bytes                                                                                        |
| `__fixtures__/`                                                 | the three webhooks captured in Monobank's test mode (none carries a card token), the test merchant's public key in the `GET /pubkey` reply shape, and test helpers |
| `monobank-adapter.{requests,transport,parse,signature}.test.ts` | the tests, all through the port, on an injected `fetch` spy                                                                                                        |

- **Configuration.** `createMonobankAdapter({ apiUrl, merchantToken, webhookPublicKey?, fetch? })` takes explicit config, so tests build it without env; `fetch` defaults to `globalThis.fetch`, resolved on every call, and a trailing slash on `apiUrl` is dropped. `index.ts` builds `defaultPayment` from `@repo/env/monobank` and is the only reader of that module: `MONOBANK_API_URL` (default `https://api.monobank.ua`), `MONOBANK_MERCHANT_TOKEN` (the `X-Token`; the personal token from `api.monobank.ua` is the test-mode token for dev and preview, and production uses the merchant token) and the optional `MONOBANK_WEBHOOK_PUBLIC_KEY`. The module validates when `index.ts` is first imported, and nothing imports `index.ts` yet.
- **Consumers inject the port through a factory**, the seam `endpoints/storage/` uses: an endpoint factory takes a `PaymentPort` and the endpoint barrel passes it `defaultPayment`. Tests pass a fake to the factory and never import `index.ts`. They import the type with a statement-level `import type { PaymentPort } from "…/infrastructure/payment"`: the inline `import { type PaymentPort }` form keeps the import at run time, which evaluates `index.ts` and validates `@repo/env/monobank`.
- **The `monobank-*` files are private to this directory.** The dep-cruiser rule `api-server-payment-vendor-is-private` refuses any import of them from outside `infrastructure/payment/`; everything else imports from `index.ts`.

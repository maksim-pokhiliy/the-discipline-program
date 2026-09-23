# Monobank acquiring — verified notes (2026-09-22/23)

What the planner verified against mono's public docs before founding the initiative. Everything here is a citation, not a memory; the "open items" are what the docs site did not render server-side (SB-1) and must be read in a browser or learned from the 0.2 spike.

## Endpoints (all under `https://api.monobank.ua`, header `X-Token` = merchant token from `web.monobank.ua`, or a test token from `api.monobank.ua`)

| Purpose                      | Endpoint                                                                           | Verified fields / notes                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create invoice               | `POST /api/merchant/invoice/create`                                                | `amount` (minor units, required) · `ccy` (ISO 4217, default 980) · `validity` (seconds, default 24 h, max 30 days) · `paymentType` `debit` (default) / `hold` (9-day block) / `verification` (amount 0) · `webHookUrl` · `redirectUrl` · `merchantPaymInfo` (required if fiscal integration is on) · `saveCardData { saveCard, walletId }`. Returns `invoiceId` + `pageUrl`. |
| Invoice status               | `GET /api/merchant/invoice/status?invoiceId`                                       | statuses `created · processing · hold · success · failure · reversed · expired`; webhook carries the same shape plus `walletData { cardToken, walletId, status: new/created/failed }` after tokenization.                                                                                                                                                                    |
| Pay by token (recurring)     | `POST /api/merchant/wallet/payment`                                                | `cardToken` · `amount` · `ccy` · `initiationKind` **`merchant`** (repeat charge initiated by us, no client confirmation) / **`client`** (client-present saved-card payment) · `redirectUrl` (3DS return) · `webHookUrl` · `merchantPaymInfo` · `paymentType`.                                                                                                                |
| Saved cards                  | `GET /api/merchant/wallet?walletId` · `DELETE /api/merchant/wallet/card?cardToken` | list `{ cardToken, maskedPan, country }` / delete a token.                                                                                                                                                                                                                                                                                                                   |
| Native subscription — create | `POST /api/merchant/subscription/create`                                           | `amount` (required) · `ccy` (default 980) · `interval` (required, `{число}{одиниця}`: `1d`, `2w`, `1m`, `1y` — so `4w` is the format) · `validity` · `redirectUrl` · `webHookUrls` (object — nested fields NOT rendered, SB-1). 200 = a payment link for the first payment.                                                                                                  |
| Native subscription — status | `GET /api/merchant/subscription/status?subscriptionId`                             | 200 "інформація про регулярний платіж"; response schema + status enum NOT rendered (SB-1). 404 «Підписку не знайдено».                                                                                                                                                                                                                                                       |
| Native subscription — edit   | `POST /api/merchant/subscription/edit`                                             | `subscriptionId` · `action` — enum with ONE value: `cancel` («поки тільки одна дія») · optional `refundAmount`. No amount/interval/pause edits exist.                                                                                                                                                                                                                        |
| Native subscription — remove | `POST /api/merchant/subscription/remove`                                           | «для видалення підписки, якщо по ній ще не було виконано оплат» — pre-payment only.                                                                                                                                                                                                                                                                                          |
| Native subscription — lists  | `GET /api/merchant/subscription/payments` · `GET /api/merchant/subscription/list`  | payment history by subscription id · a client's subscriptions (schemas not rendered, SB-1).                                                                                                                                                                                                                                                                                  |
| Webhook public key           | `GET /api/merchant/pubkey`                                                         | base64 PEM ECDSA key for `x-sign`.                                                                                                                                                                                                                                                                                                                                           |
| Fiscal checks                | `GET /api/merchant/invoice/fiscal-checks`                                          | exists (ПРРО section); details not rendered.                                                                                                                                                                                                                                                                                                                                 |

## Webhooks

- Header `x-sign`: ECDSA over SHA-256 of the raw request body; verify with the base64-decoded PEM public key from `/api/merchant/pubkey` (cache it; rotate on verification failure).
- Delivery: «If the third-party server does not respond with HTTP 200 OK status, the acquiring backend retries the attempt up to three times.» → the route must be idempotent (invoice id + status + modified date as the event key) and answer 200 fast; heavy work after the ledger write.
- Example payload: `{ invoiceId, status, amount, ccy, createdDate, reference }` (+ `walletData` when a card was tokenized). Recurring-charge and subscription-status webhooks: shape NOT verified (SB-1, spike 0.2).

## Test environment

- «API може працювати в режимі тестового середовища. Для цього потрібно використовувати токен із https://api.monobank.ua/» — «доступне всім клієнтам банку» (no business account needed).
- Any card number that passes Luhn, any expiry/CVV; a real card is accepted but no financial authorization happens. Apple Pay / Google Pay do not show with a test token. Subscription support in test mode: unverified (SB-1).

## Fees, settlement, cards

- 1.3% on Ukrainian cards, 2% on foreign cards (POS / tap-to-phone: 1.3% on foreign too). «Наступного дня переказуємо гроші на бізнес-рахунок.»
- Foreign cards ARE accepted — "mono = Ukraine only" is false at the rail level; the limit is the product's language/marketing. Invoice currency other than 980 for a FOP terminal: unconfirmed (SB-2).

## Connecting a FOP

- «Для підключення обовʼязково потрібно бути зареєстрованим як ФОП чи відкриту юрособу і мати відкритий рахунок ФОП чи юрособи у mono.» Then business cabinet → «Додати інструмент» → еквайринг; two mandatory stages (business info: activity, site, socials → instruments); «Зазвичай це займає до 10 хвилин».
- Internet-acquiring site checklist (verbatim): «Є українська версія сайту · Є інформація про компанію — наприклад, розділ "Про нас" або оферта · Є контакти, чат або форма для зв'язку · Товари мають фото, опис і ціну.» → D-12, plan 0.4.
- Denys's state 2026-09-23: FOP registered, NO mono business account. Chain: open the FOP account in the mono app (via Дія) → apply for internet acquiring → merchant token appears in the business cabinet (SB-5).

## РРО / fiscalization

- Law 265/95-ВР art. 9 p. 14: РРО/ПРРО are not applied to settlements for SERVICES made exclusively through bank remote-service systems and/or money-transfer services. ДПС/НБУ explanations list LiqPay, Portmone, iPay, WayForPay, EasyPay as such services (the class mono's internet acquiring belongs to), but «сервіс переказу коштів» is undefined in the law and practice varies; an individual tax consultation (ІПК) is the safe route.
- mono's own ПРРО ("Є-Чек"): 180 UAH/month per cash register, works with mono acquiring incl. internet acquiring. If enabled, `merchantPaymInfo` with a basket is required on invoices → D-10 sends it always. Whether native subscriptions can carry a basket: unverified (feeds D-3).
- Denys's accountant does not know the nuance; the owner told Denys to take a tax consultation (2026-09-23 15:54).

## Open items (SB-1) — read in a browser, then fold here

1. `webHookUrls` nested fields on `subscription/create`.
2. `subscription/status` response schema + the status enum; `subscription/payments` and `subscription/list` schemas.
3. What a recurring-charge webhook looks like; what happens on a declined renewal (retries? how many? status?).
4. Can the client cancel a subscription from the mono app? Does a webhook fire?
5. Does the test token cover `subscription/*` and `wallet/payment`?
6. The "Skill для AI-агентів" archive (SKILL.md + 6 server samples) — download via the button on `/api-docs/acquiring/dev/ai-tools/docs--ai-skills`; drop it into the session scratchpad.

## Sources

mono acquiring KB: `monobank.ua/knowledge-base/acquiring/index`, `/signup` · API docs: `monobank.ua/api-docs/acquiring` (methods/subscription/_, extras/tokens/_, dev/webhooks/verify, dev/test/docs--testing) · old Redoc spec (no subscription section): `api.monobank.ua/docs/acquiring.html` · Forbes 2023-09-22 on mono's ПРРО · Checkbox / ДтКт / 7eminar articles on art. 9 p. 14 · Apple: `developer.apple.com/app-store/review/guidelines/` (3.1.1, 3.1.3), `/app-store/subscriptions/` (rates, grace 3/16/28 d, 60-day retry), App Store Connect help (durations).

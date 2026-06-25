# Legacy-mobile port

The legacy mobile (Spring) backend's REST surface, for the Connector push-projection. Used to sign in as a coach's legacy ADMIN identity, list the public training levels, and read/create/update a single calendar day's `general_programs` row (the General publish channel).

## Why a port?

Unlike the other ports here, the vendor is **not** a free choice: it is a single, **frozen** upstream — Vladyslav's Spring Boot 3 backend at `thedisciplineprogram.com/api/v1`, feeding the live App-Store iOS app. We are a pure ADMIN client of it; the legacy dev is unavailable and no legacy/iOS changes are possible. The port exists so the one place that knows the legacy wire shapes, the raw-token auth quirk, and the absent-row/conflict status mapping is the adapter — the publish service depends only on `LegacyMobileClientPort` and the clean `Legacy*` types, never on the HTTP details. Tests inject a fake port; the real adapter (and its `ApiClient`) is never constructed at test import time.

## Shape

Every method maps one legacy endpoint:

- `signin(email, password)` → `POST /auth/signin`, no auth header, returns the connected identity + `accessToken`.
- `getTrainingLevels(token)` → `GET /trainingLevel/all` (the General-channel level picker; a public legacy read, no identity bridge).
- `getGeneralProgram(token, levelId, scheduledDate)` → `GET /generalProgram`. Returns `null` when no row exists for that `(level, date)` (see the 404 note) so the publish orchestrator can branch cleanly on "no row yet".
- `createGeneralProgram(token, input)` → `POST /generalProgram`.
- `updateGeneralProgram(token, input & { id })` → `PUT /generalProgram`.

`LegacyGeneralProgramWriteInput` is `{ levelId, scheduledDate, isRestDay, dailyProgram }`; `dailyProgram` is `null` on a rest day (the legacy row enforces `is_rest_day` XOR `daily_program`). The `Legacy*` types are clean TS shapes — the adapter Zod-parses the raw legacy responses at its boundary and re-exposes these types, so the wire schemas never leak past the port.

### Raw-token contract

**The token is a per-call argument, not client state** — every authed method takes the bare `accessToken` as its first parameter, so the default singleton stays a stateless no-arg instance and the per-coach token is decrypted and threaded in by the caller. The adapter sets `Authorization: <accessToken>` with **NO `Bearer ` prefix**: the iOS app sends the bare token and the legacy auth filter strips a literal `"Bearer"` substring, so a `Bearer ` prefix would corrupt the token and fail the request. This is a hard requirement of the frozen upstream, documented here because it is the single most surprising thing about this port.

### Absent-row, conflict, and upstream-failure mapping

- `getGeneralProgram` maps the legacy **404 / empty** absent-row response to `null`; any other error propagates. The publish orchestrator reads `null` as "create", a value as "update".
- `createGeneralProgram` lets the legacy **409** propagate (the platform maps it to a `ConflictError`). The legacy side has no DB unique on `(level, date)`, so a concurrent insert can race; the orchestrator catches the 409 and falls back to a PUT (re-GET → update). The adapter does NOT swallow or re-wrap the 409 — the typed error carries the status the orchestrator branches on.
- Any other upstream failure (a thrown `InternalServerError`/`ServiceUnavailableError`, a transport error, or a non-`AppError`) is normalized to a `BadGatewayError` (502) via `mapLegacyError`, so a legacy outage surfaces as "bad upstream response" rather than "this service is down". `TimeoutError` (504, from the `ApiClient` abort path) and `NotFoundError`/`ConflictError` pass through untouched — the orchestrator branches on them.

## Adapter placement

The vendor is fixed; the adapter is wired as follows:

1. `infrastructure/legacy-mobile/rest-adapter.ts` — the ONLY file that builds the legacy `ApiClient` (a second `@repo/api-client` instance: legacy base URL, 10s timeout, 2 retries, a `getHeaders` returning the raw `Authorization`). Authed methods construct a per-token client (`buildAuthedClient`); `signin` uses a no-auth one (`buildNoAuthClient`).
2. Env vars live in `packages/env/src/mobile-publish.ts` (`LEGACY_MOBILE_API_BASE_URL`).
3. `infrastructure/legacy-mobile/index.ts` re-exports the adapter factory and exposes `defaultLegacyMobileClient = createLegacyMobileRestAdapter()`.
4. The coaching publish service injects the default via the storage factory-DI pattern: `createMobilePublishApi(defaultLegacyMobileClient)`.

## Non-goals

- **No Individual channel.** The per-athlete `individualProgram*` endpoints and the `GET /user?userPlanId=2` athlete picker are out of scope; the port commits to the General (training-level) channel only. Individual is a separate, wider concern.
- **No DELETE / un-publish.** There is no method to remove a legacy row. Publishing only creates or updates; tearing a day back down is not supported and is not on this port.
- **No legacy-side or iOS changes.** The upstream is frozen and inviolable. If a behavior is missing on the legacy side (e.g. a unique constraint on `(level, date)`), we work around it on our side — we do not ask for or assume legacy changes.
- **No token storage / cipher.** Encrypting the per-coach token at rest is the coaching layer's job (`utils/token-cipher.ts`); the port only ever sees a plaintext token as a call argument and never persists it.

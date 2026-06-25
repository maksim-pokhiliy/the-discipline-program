# Mobile publish: legacy connector operations

Operational notes for the Connector push-projection that publishes platform plans into the legacy mobile (Spring) backend. The legacy upstream is **frozen and external** (Vladyslav's Spring Boot 3 backend feeding the App-Store iOS app); we are a pure ADMIN client of it and cannot change it. That makes a handful of failure modes the operator's problem rather than something we can fix in code. See the port doc at [`packages/api-server/src/infrastructure/legacy-mobile/README.md`](../../packages/api-server/src/infrastructure/legacy-mobile/README.md) and `initiatives/mobile-publish/` for the why.

The five endpoints live under `apps/platform/src/app/api/platform/mobile/*` (connections, training-levels, links, publish), all `withCoachAuth`-gated.

## Token expiry → reconnect

Each coach connects once with their legacy credentials; we encrypt the returned `accessToken` at rest (AES-256-GCM, `MOBILE_PUBLISH_ENCRYPTION_KEY`) and store the expiry. The legacy token is a JWT with a **~1-month TTL** (read from its `exp` claim; a 30-day fallback when the claim is unreadable). When it lapses, the legacy side rejects every authed call (levels, publish) with a 401.

We surface this as a stable, machine-readable signal rather than an opaque 500: a `401 UnauthorizedError` carrying `reason: "MOBILE_RECONNECT_REQUIRED"`. A coach whose stored cipher blob fails to decrypt (rotated `MOBILE_PUBLISH_ENCRYPTION_KEY`, tampered row) gets the same `reason` on a `400 BadRequestError` ("stored mobile credential is unreadable — please reconnect").

**Action:** the coach re-runs `POST /api/platform/mobile/connections` with their legacy credentials; the row is upserted (one connection per coach) and publishing resumes. There is no refresh-token rotation and no server-side reconnect UX yet — the CTA ships later (initiative deferred MP-4). Until then, "reconnect" is a manual re-POST.

**Note on key rotation:** there is one encryption key, no key-versioning. Rotating `MOBILE_PUBLISH_ENCRYPTION_KEY` invalidates **every** stored token at once → every coach must reconnect. With a handful of coaches this is acceptable; envelope encryption / key-versioning is deferred (MP-9). Do not rotate the key casually.

## Legacy upstream down or slow (502 / 504)

The adapter normalizes legacy transport/5xx failures so the publish envelope is honest about who failed:

- Legacy unreachable, a transport error, or a legacy `5xx` → **`502 BadGatewayError`** ("bad upstream response" — the legacy side failed, not us).
- Legacy too slow (the 10s `ApiClient` timeout trips) → **`504 TimeoutError`**.

Both are transient and **safe to retry** — publishing is idempotent (below). There is nothing to fix on our side for a 502/504; it means the legacy backend is having a moment. Confirm legacy reachability (`thedisciplineprogram.com/api/v1`) before assuming a platform bug. No metrics/alerts are wired for this path (low-volume, coach-triggered); the per-day `results` array in the publish response is the audit of what landed.

## Publish is idempotent and re-runnable

`POST /api/platform/mobile/publish` (day or week scope) is safe to re-run. Per calendar day it returns one of four actions:

- `created` — no legacy row existed, we POSTed it.
- `updated` — a legacy row existed (ours, or an unowned row with `overwriteUnowned: true`, or a 409-race fallback) and we PUT.
- `skipped` — our record exists and the content hash is unchanged → no legacy write (the cheap path; re-running an unchanged week writes nothing).
- `conflict` — a legacy row exists that we did not author (the coach typed it directly in iOS, or another channel wrote it) and `overwriteUnowned` is `false` → **no write**, surfaced for the operator/coach to decide. Re-run with `overwriteUnowned: true` to overwrite it.

A partial week is fine: each day is independent, and the `results` array reports exactly what landed. If a publish fails mid-week on a 502/504, just re-run — already-published unchanged days come back `skipped`.

**Concurrency caveat (known, legacy-side):** the legacy table has no DB unique on `(level, date)`, so a true concurrent double-publish of the same day could in theory double-insert on the legacy side. Our GET→POST→(409→PUT) fallback converges to one row in the typical race, and our own `MobilePublishedDay` table is race-free (upsert on `(linkId, scheduledDate)`). The residual window is a legacy defect we cannot close (initiative MP-8, documented, OPEN). A coach double-clicking Publish is additionally de-duped at our edge by the platform's own `Idempotency-Key` on `POST /publish`.

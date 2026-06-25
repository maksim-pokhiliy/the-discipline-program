# mobile-publish — state (the board)

**Updated:** 2026-06-25 — **P1a DONE (server/integration foundation, all green; in PR `feat/mobile-publish-p1a`).** The connector's server spine ships: 3 Prisma models (`MobileConnection`/`MobilePublishLink`/`MobilePublishedDay`) + migration; AES-256-GCM token cipher (`@repo/env` `MOBILE_PUBLISH_ENCRYPTION_KEY`); the legacy REST client (`infrastructure/legacy-mobile/`, raw-token header); the Day→legacy-text projection via a shared `renderRowLine` SSOT seam (`@repo/contracts/lms/row-text`, D-8); the idempotent publish service (GET→POST/409→PUT/skip, overwrite-guard, per-day `failed` isolation, D-9); and 5 coach-gated endpoints. D-6…D-9 ratified. check-types 16/16 · lint 16/16 · dep:check 0 · 61 api-server units + 1002 contracts green. **Next = P1b (coach UI).** Live-validated this session: the migration is applied to dev (neondb) + the gated T16 ran green (7/7) against the harness — which caught + fixed 4 real legacy wire bugs (signin `username`, `/api/v1` base, nested `trainingLevel`, nullable name). Prod still needs the two env vars in Vercel + the `db-migrate.yml` deploy.

## Board

| #   | Phase                           | Status     | Pointer                                                                         |
| --- | ------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| 0   | Local legacy harness            | ✅ done    | `legacy-contract.md` (verified live); `tdp/local/docker-compose.yml` — stack UP |
| 1a  | Connector server foundation     | ✅ done    | PR `feat/mobile-publish-p1a`; D-6…D-9; `endpoints/coaching/mobile-publish/`     |
| 1b  | Coach UI (connect/link/publish) | ⏳ next    | `plan.md` P1 1.3/1.4/1.6 — UI-first on mocks; consumes the P1a endpoints        |
| 2   | Individual publish              | ⏳ pending | `plan.md` P2 — coach links to a legacy athlete (MP-1)                           |
| 3   | Hardening                       | ⏳ pending | `plan.md` P3 — overwrite-guard UX, token-refresh UX, audit (MP-3/4/9/10)        |

## Next action

**▶ Start P1b — coach UI** (UI-first on mocks, per the training-domain workflow): "Connect mobile app" on the coach profile (legacy login → `POST /api/platform/mobile/connections`); the plan → Level link (`GET /training-levels` + `POST /links`); the Publish button day/week (`POST /publish`, render the per-day `{created,updated,skipped,conflict,failed}` results). The 5 server endpoints + client-fn seam are ready; P1b adds the `@repo/api-client` fns + TanStack hooks + screens.

**Live-validated this session:** the migration is applied to dev (neondb) and the gated T16 ran **green (7/7)** — connect→link→publish→republish(skipped)→edit(updated), 404→null confirmed (CORR-002). The live run caught + fixed 4 wire bugs invisible to the mocked units (signin `username` not `email`; base URL needs the `/api/v1` prefix; `generalProgram` write body needs a nested `trainingLevel:{id}`; response `trainingLevel.name` nullable). **Before prod:** set `MOBILE_PUBLISH_ENCRYPTION_KEY` + `LEGACY_MOBILE_API_BASE_URL` (with `/api/v1`) in Vercel; the migration rides `db-migrate.yml` post-merge. Re-run T16 anytime: `RUN_LEGACY_INTEGRATION=1` + the harness up + dev `DATABASE_URL` exported.

## Open decisions awaiting ratification

- **(none open)** — D-1…D-9 ratified. P1b is UI/UX (planner-coach lens); no new architecture decisions expected beyond the client-fn/hook shape.

## Gotchas a resuming session must know

- **P1a env var:** `MOBILE_PUBLISH_ENCRYPTION_KEY` (base64 32-byte, `openssl rand -base64 32`) + `LEGACY_MOBILE_API_BASE_URL` — both in `.env.example`; set them in dev `.env` + Vercel before the endpoints work. The cipher fails closed at boot on a bad key.
- **The local harness is UP** — `docker compose -f ~/projects/contrib/tdp/local/docker-compose.yml {ps,down,up -d --wait}`. Backend `localhost:8080/api/v1`; DB host `5433`. Seeded ADMIN `admin@tdp.local` / `Admin123!` (role ADMIN, plan General, level Pro=id 2). Data EPHEMERAL — re-seed recipe in `journal.md`.
- **WSL→Docker cred-bypass:** `export DOCKER_CONFIG=~/projects/contrib/tdp/local/.docker`.
- **Auth header = RAW token** (no `Bearer `) — the adapter (`rest-adapter.ts`) sends the bare `accessToken`.
- **POST is insert-only → 409**; publish emulates upsert (GET→POST/409→PUT/skip). Skip compares to LIVE legacy content (D-9), so an out-of-band iOS edit of an owned day is re-published, not silently skipped. Unowned day + `overwriteUnowned:false` → `conflict` (never clobbered).
- **Token TTL = 1 month, no refresh** → reconnect ~monthly; P1a emits a `MOBILE_RECONNECT_REQUIRED` signal on a legacy 401 / decrypt-fail (MP-4 = the UX).
- **The iOS app has in-app `CreateProgram`** — a published day can collide with a coach-typed one → the overwrite-guard (D-4/D-9) surfaces it as `conflict`.
- **Legacy is SEPARATE infra** — consume its REST API as ADMIN only; never touch its code/DB. Legacy prod DB inviolable; P1a only ever talks to localhost:8080.

## Live carry-forwards (see `deferred.md`)

MP-1 (individual identity picker = P2) · MP-2 (bake resolved weights, P2-opt) · MP-3 (delete-propagation, P3) · MP-4 (token-refresh UX, P3) · ~~MP-5 (Week.startDate=Monday)~~ **CLOSED (verified)** · MP-6 (level-name drift — mitigated, read live always) · ~~MP-7 (placement)~~ **CLOSED (D-6)** · MP-8 (no legacy unique — mitigated; residual legacy TOCTOU) · MP-9 (token key rotation, P3) · MP-10 (week-publish resilience/latency, P3) · MP-NORTH-STAR (repoint iOS → platform API — future initiative).

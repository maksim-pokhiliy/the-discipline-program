# apex-sunset — state (the board)

**Updated:** 2026-08-08 — **P1.1 DONE** (shim foundation, PR #364 `7b3e4337`, owner-merged; prod migration + deploy verified). `/api/v1/*` is live on the platform domain: `signin` + both catalogs + a legacy-format bearer wrapper + the `MobileLegacyIdentity` table + a golden suite (21/21 vs the live harness). Load-bearing fact banked: **the legacy auth failure surface is 403-empty (zero-byte, no content-type) for EVERY failure**, not the 500 the step assumed — Spring Security 6's default entry point + the `/error` re-dispatch swallow the explicit 401 (see journal 2026-08-08); the shim mirrors it, the golden pins it. P0 facts still current: legacy DB holds ZERO athlete-generated data (19 users, 640+321 program days, 4 catalogs); app is a read-only viewer hardcoded to apex (DNS takeover = free repoint); compat surface = 9 endpoints, contract in `mobile-publish/legacy-contract.md`.

## Board

| #   | Phase                        | Status      | Pointer                                                             |
| --- | ---------------------------- | ----------- | ------------------------------------------------------------------- |
| P0  | Facts & safety net           | ✅ done     | `plan.md` 0.1–0.5 all ✅; journal 2026-08-07                        |
| P1  | The shim (`/api/v1/*`)       | 🔶 1.1 done | 1.1 ✅ (#364); 1.2/1.3/1.4 pending; `legacy-contract.md` = the spec |
| P2  | Accounts (full users import) | ⬜ pending  | D-3; dry-run on the P0 dump first                                   |
| P3  | Rehearsal & cutover          | ⬜ pending  | D-5 rehearsal; apex DNS → Vercel                                    |
| P4  | Cleanup & close-outs         | ⬜ pending  | AS-4/AS-5; `mobile-publish` → superseded                            |

## Next action

**▶ P1.1 DONE (2026-08-08).** Shim foundation shipped + prod-verified (see journal). Assets a resuming session can use: golden harness recipe = `scripts/legacy-harness-seed.sh` (committed, idempotent) → `RUN_LEGACY_INTEGRATION=1 SKIP_ENV_VALIDATION=1 pnpm exec vitest run --project platform src/app/api/v1/`; the restored prod snapshot `tdp-dump-verify` (PG 17.5, `prod_snap`/`dev_snap`) is still the P2.1 dry-run playground; dumps at `~/projects/contrib/tdp/dumps/2026-08-07/`. **Next: P1.2 (user endpoints) via `/step`** — `GET /user/{id}`, `GET /user`, `PUT /user`, `changePassword`, `changeTrainingLevel`, served from platform models via the `MobileLegacyIdentity` map; golden extension absorbs the AS-8 cold-start warmup. P2.1 (users import) is unblocked by the verified dump AND now the identity table exists (empty in prod until 2.1). Owner-side ride-alongs unchanged: **AS-1** ($99 membership) · the 5432-exposure ask to Vladyslav · Trello board setup · **NEW: AS-9** (prod rate limiting is a platform-wide no-op — Upstash not set in Vercel — owner decides whether to wire it; RF-2 is already fixed so wiring it later is safe).

## Open decisions awaiting ratification

- **(none open)** — D-1..D-7 ratified (D-6/D-7 added at P1.1 close-out). Remaining step-level designs (publish-snapshot schema at 1.3, apex routing at 3.2) are deferred to their steps, not open decisions.

## Live carry-forwards

AS-1 (App Store Connect access — future redesign + bus factor, NOT a cutover blocker) · AS-2 (`/dev-api` dies with the VPS, accepted) · AS-3 (XCUITest smoke in CI — optional) · AS-4 (surviving `mobile-publish` UI carry-forwards re-home at P4) · AS-5 (`MobileConnection`/cipher/env-vars fate — P4 design) · **AS-7** (bcrypt timing oracle cost 10-vs-12 — fix rides the P2.1 import) · **AS-8** (golden cold-start flake on pooled Neon + local-isolation — fix rides P1.2's golden extension) · **AS-9** (prod rate limiting no-op — Upstash absent in Vercel; owner decision).

## Gotchas a resuming session must know

- **The iOS app's wire traps are sacred** (charter): raw `Authorization` (no `Bearer `), HTTP 200-only success, `yyyy-MM-dd` dates everywhere, `PROGRAM_ID` header on 409, never `isRestDay:false` + `dailyProgram:null` (a `fatalError` on the app's main screen), 403 — not 401 — drives sign-out.
- **The app sends `userId: Int`** — the users import MUST preserve legacy integer ids in a map (D-3); a cuid in `JwtDTO.userId` kills the decode.
- **Do NOT patch the legacy backend** (IDOR etc.) — it dies; and legacy prod stays inviolable until the final snapshot (charter Sacred).
- `mobile-publish` is still ACTIVE in parallel until P4 closes it as superseded — don't double-book its MP- numbers; this initiative uses AS-.
- The local legacy harness (`tdp/local/docker-compose.yml`, backend `localhost:8080/api/v1`, DB host 5433) is the golden-test target — recipe in `mobile-publish/journal.md`.
- **Prod Postgres is 17.5; the harness compose pins `postgres:16-alpine`** — PG16 `pg_restore` cannot read PG17 custom-format dumps. Bump the harness image to `17-alpine` the first time a step touches it (P1.1). The restored prod snapshot lives in local container `tdp-dump-verify` (`prod_snap`/`dev_snap`).
- Real prod `users` columns (drifted from `schema.sql`): `user_role_id`, `training_level_id`, `user_plan_id`, `is_enabled` — 8 of 19 users are disabled; the shim's auth + the P2.1 import must honor disabled semantics per the legacy contract.

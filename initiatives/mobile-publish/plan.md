# mobile-publish — plan (the phased roadmap)

Status: ✅ done · 🔄 in progress · ⏳ pending · ⛔ blocked

## P0 — Local legacy harness ✅ done

- 0.1 Stable full clones under `~/projects/contrib/tdp/` (`mobile-ios`, `mobile-backend`) ✅
- 0.2 `tdp/local/docker-compose.yml` — database (host 5433) + backend (prod profile, host 8080) ✅
- 0.3 Build + boot the legacy backend ✅ (cred-bypass + `postgres:16-alpine` pin; backend healthy on 8080)
- 0.4 Apply `schema.sql` (tables + seeds roles/levels/plans); seed one enabled ADMIN via direct SQL (bcrypt via `htpasswd`) ✅
- 0.5 Verify the contract by curl: `signin → POST → GET → dup-POST 409 → PUT → athlete GET /program` — all green ✅
- 0.6 Deltas recorded in `legacy-contract.md` (none material; dup = 409, auth header = raw token) ✅

## P1 — Connector + General publish (no identity bridge)

### P1a — server/integration foundation ✅ done (PR `feat/mobile-publish-p1a`; D-6…D-9)

- 1.1 Prisma `MobileConnection` + `MobilePublishLink` + `MobilePublishedDay` (idempotency ledger) + migration ✅
- 1.2 Legacy API client (`infrastructure/legacy-mobile/`, contracts-first Zod): signin, `trainingLevel/all`, `generalProgram` GET/POST/PUT; RAW-token header; 404→null / 409→propagate ✅
- 1.2b Token cipher (AES-256-GCM, `MOBILE_PUBLISH_ENCRYPTION_KEY`) + `@repo/env` per-feature file ✅ (D-7)
- 1.5 Projection `Day → dailyProgram` via a shared UI-free `renderRowLine` SSOT seam (`@repo/contracts/lms/row-text`) — NOT `build-session-detail` ✅ (D-8; refines D-5's mechanism, intent preserved + parity-tested)
- 1.6 Idempotent publish service (GET→POST/409→PUT/skip; live-content skip; overwrite-guard re-decide; per-day `failed` isolation) + 5 coach-gated endpoints ✅ (D-9)
- 1.7 Verify: 61 api-server units + 1002 contracts + a gated E2E (`mobile-publish.integration.test.ts`, `RUN_LEGACY_INTEGRATION=1`, against localhost:8080) — owner runs after applying the migration to dev

### P1b — coach UI ✅ done (PR `feat/mobile-publish-p1b`; D-10/11/12)

- 1.3 Connector UI: coach profile → "Connect mobile app" (legacy login → `POST /connections`) → show connected identity + expiry + a proactive reconnect nudge ✅ (`MobileAppSection` + `ConnectMobileModal`)
- 1.4 Link UI: plan → pick a Level (`GET /training-levels` + `POST /links`); persist the link on the plan ✅ (inline "Mobile publishing" strip + `ManageMobileLinksModal`, D-10)
- 1.6b Publish button (week → `POST /publish`); render the per-day `{created,updated,skipped,conflict,failed}` results; surface `conflict` for the D-4 overwrite confirm ✅ (`PublishWeekModal` per-link `allSettled` loop, results grouped by level, conflict → nested overwrite confirm). Day-scope UI not built (P3); week scope only.
- 1.8 Additive server addendum (shipped under P1b): `listLinks`/`deleteLink` services + `GET /links?planId=` + `DELETE /links/[id]` routes + contract query/params schemas; `MOBILE_RECONNECT_REQUIRED` promoted to `@repo/contracts` (D-12). Unlink IN scope; disconnect (`DELETE /connections`) DEFERRED to P3 (D-11, MP-12). ✅

## P2 — Individual publish ⏳

- 2.1 Link UI: plan-enrollment → pick a legacy athlete (`GET /user?userPlanId=2`)
- 2.2 Publish into `individual_programs` (per athlete)
- 2.3 (optional) Bake the athlete's resolved working weights into the text — we know his 1RMs (MP-2)

## P3 — Hardening ⏳

- 3.1 Overwrite-guard (warn before clobbering a day authored outside the platform)
- 3.2 Token-expiry UX (~1mo, no refresh; reconnect prompt) + secure token-storage review
- 3.3 Publish history / audit (what was pushed where, when)
- 3.4 Rest-day mapping + delete-propagation policy (MP-3)

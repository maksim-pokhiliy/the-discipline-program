# mobile-publish — journal (append-only)

## 2026-06-25 — Founded; direction ratified; P0 started

- Received Vladyslav's two repos (iOS app + Spring backend); cloned both fully to `~/projects/contrib/tdp/` (`mobile-ios` on `develop`, `mobile-backend` on `master`). Platform monorepo left in place.
- Read both ends: the legacy plan model (per-day `general_programs` / `individual_programs` with a free-text `dailyProgram` JSONB), the full auth/role/token stack, and our platform's plan domain (`TrainingPlan→Week→Day→Session→Block→Schema→SchemaRow`). Verified wire contract → `legacy-contract.md`.
- Ratified with the owner the **Connector push-projection** direction (D-1…D-5): legacy untouched; per-coach legacy auth (store token, not password); link = channel+key (General first); idempotent upsert + overwrite-guard; lossy text projection via `build-session-detail`. The connector's manual, coach-driven link dissolves the cross-system identity blocker (owner: user-bases "probably the same, but we don't know"; delivers both by-level and by-user; legacy stays frozen — its dev is busy).
- Owner note: the mobile app has SEVERAL admins → connections are per-coach, each connecting as himself (folded into D-2).
- Started P0: wrote `tdp/local/docker-compose.yml`; kicked off the legacy backend docker build as the publish test-harness.

## 2026-06-25 — P0 DONE (legacy harness up + contract verified live)

- **Infra fixes:** (1) WSL→Docker cred-bypass — `credsStore: desktop.exe` not on the non-interactive PATH → a `{"auths":{}}` config at `tdp/local/.docker` + `DOCKER_CONFIG`. (2) `postgres:alpine` now = PG18+ whose data-dir layout breaks a `/var/lib/postgresql/data` mount → pinned `postgres:16-alpine`, dropped the named volume (ephemeral harness), added a healthcheck + `up --wait`. (yapster on 5432 left alone — legacy DB is on 5433.)
- **Stood up:** db + backend healthy; applied `schema.sql` (7 tables + seeds: levels Scaled/Pro/Advanced, plans General/Individual, roles USER/ADMIN); seeded one enabled ADMIN by direct SQL (bcrypt via `htpasswd`).
- **Contract verified by curl, all green:** `signin` (→ token, role ADMIN, plan General, exp ~1 mo) → `POST /generalProgram` **200** (ADMIN gate passes, `dailyProgram` JSONB round-trips intact) → `GET /generalProgram?trainingLevelId=&scheduledDate=` 200 → duplicate POST **409** "already exists" (insert-only) → `PUT` 200 (republish in place) → **athlete route** `GET /program?userId=&scheduledDate=` 200 returns the published day (the exact call the iOS app makes). **Zero deltas** from the source-read contract; enrichment: dup = HTTP 409; auth header = RAW token (no `Bearer`).
- **Next:** P1 (connector + General publish) via `/feature`, plan-first. Proposed split P1a (server/integration foundation) → P1b (coach UI). See `state.md` Next action.

### Re-seed recipe (harness data is ephemeral — after any recreate)

```
export DOCKER_CONFIG=~/projects/contrib/tdp/local/.docker
docker compose -f ~/projects/contrib/tdp/local/docker-compose.yml up -d --wait
docker exec -i tdp_legacy_db psql -U tdp -d tdp < ~/projects/contrib/tdp/mobile-backend/backend/src/main/resources/schema.sql
HASH=$(docker run --rm httpd:alpine htpasswd -nbBC 10 x 'Admin123!' | cut -d: -f2)
docker exec tdp_legacy_db psql -U tdp -d tdp -c "INSERT INTO users (is_enabled,username,password,user_role_id,user_plan_id,training_level_id) VALUES (true,'admin@tdp.local','$HASH',2,1,2) ON CONFLICT (username) DO UPDATE SET password=EXCLUDED.password,is_enabled=true,user_role_id=2,user_plan_id=1,training_level_id=2;"
# signin → raw token in Authorization header:
curl -s -X POST localhost:8080/api/v1/auth/signin -H 'Content-Type: application/json' -d '{"username":"admin@tdp.local","password":"Admin123!"}'
```

## 2026-06-25 — P1a DONE (server/integration foundation; via `/feature`)

Built the full connector server spine on `feat/mobile-publish-p1a` (19 commits, all green: check-types 16/16, lint 16/16, dep:check 0, 61 api-server unit tests + 1002 contracts). Ratified **D-6…D-9**.

- **Shipped:** 3 Prisma models + 1 additive migration (gated; authored offline via `migrate diff`, owner-approved); AES-256-GCM token cipher + `@repo/env` `MOBILE_PUBLISH_ENCRYPTION_KEY`; the legacy REST adapter (`infrastructure/legacy-mobile/`, raw-token header, 404→null/409→propagate, transport/5xx→502, timeout→504); the `Day → dailyProgram` projection; the idempotent publish service; 5 coach-gated endpoints (`POST/GET /connections`, `GET /training-levels`, `POST /links`, `POST /publish`). No UI (P1b).
- **D-6 placement:** `endpoints/coaching/mobile-publish/` + `infrastructure/legacy-mobile/`; Coaching→LMS allowed, no new context/rule (MP-7 closed). api-server gained a `@repo/api-client` dep (the legacy adapter reuses `ApiClient`; owner-approved, lockfile + dep-graph updated).
- **D-8 projection seam (the big Gate-A call):** reading every formatter showed the platform's row-text family was already UI-free → extracted to a shared `@repo/contracts/lms/row-text` `renderRowLine`; the platform UI now delegates to it → **true single-function SSOT** (owner chose option (b) over a copied renderer). Honors D-5's intent (published text == platform display); a parity test enforces it. The 9-ALT copy + MP-10-consolidation path was avoided.
- **Spec corrections (code won over the brief):** `trainingNumber` = 1-based session index (not `Session.order`, steps of 10); rest-day = the `Label.rest` boolean (not a name string); UTC date-param via a centralized `utils/date-param.ts` (not `formatCalendarDate`/`formatDateParam`); `legacyUserName` = the login email (signin returns no person name).
- **Review + QA fix-loop (2 CRITICAL + 3 WARNING fixed):** per-day publish failures now isolated (`failed` action, results never discarded — QA-002); the 409-race re-runs the overwrite-guard so a raced iOS day is never blindly clobbered (SEC-001); `skipped` now compares to LIVE legacy content, detecting out-of-band iOS edits (CORR-001, refines D-9); env var renamed feature-scoped (DX-001); `startDate` format-validated (QA-004/5). Correction to the design's §8 claim: double-click isn't deduped via an Idempotency-Key (no client sends one in P1a) — convergence is via the per-(linkId,date) upsert + the legacy 409→PUT fallback.
- **Carry-forwards:** MP-5 closed (startDate=Monday verified), MP-7 closed (D-6), MP-6 mitigated (read levels live), MP-8 mitigated (residual legacy TOCTOU documented), +MP-9 (key rotation), +MP-10 (week-publish resilience). Docs: 5 READMEs synced + a new `docs/runbooks/mobile-publish-legacy-connector.md`; no CHANGELOG/ADR (none warranted — initiative-scoped).
- **Two owner-gated steps before live use:** apply the migration to dev (`migrate:dev`; additive, no prod-row risk) + run the gated `RUN_LEGACY_INTEGRATION=1 …integration.test.ts` against the local harness (confirms 404→null end-to-end, CORR-002).
- **Next:** P1b — coach UI on the 5 endpoints (UI-first on mocks).

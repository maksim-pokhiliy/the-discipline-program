# mobile-publish — state (the board)

**Updated:** 2026-06-26 — **P2a DONE (Individual channel — server/integration, in PR `feat/mobile-publish-p2a`).** The Individual publish channel ships end-to-end on the server: an additive prod-safe schema change (`MobilePublishLink` gains nullable `legacyUserId Int?` + `athleteId String?` (FK→User, Cascade), `legacyLevelId` relaxed nullable, + the `mobile_link_channel_key_xor` CHECK + bijection uniques) via two migrations (enum-value split — FLAG-2); the legacy REST client's individual methods (FLAT `userId` body; **DELETE+POST replace** since the legacy PUT is broken — D-14, `@JsonIgnoreProperties` drops the body id); a channel-agnostic publish seam (`ChannelProgramOps` injected into `publish-day` — GENERAL stays byte-identical, the 5 D-9 cases + parity untouched); the `z.union` create-link individual variant (upsert keyed on `athleteId` — D-13); and a live athletes proxy (`GET /api/platform/mobile/athletes` → legacy `GET /user?userPlanId=2`, MP-6). **D-13 + D-14 ratified; MP-14 carried** (DELETE+POST non-atomicity). The Review+QA pass caught + fixed a red contracts test (orchestrator miss) and refined the upsert key athleteId←legacyUserId (QA-04/05 — no silent steal). **Gated proof, all green:** dev migration applied; api-server mobile units 92✓; the live integration (general + individual blocks, 14✓) DELETE+POST-proves D-14 (republish edit → `updated` + a NEW legacyRowId). **P1 (#317/#318) remains LIVE in prod (General publish). Next = P2b (Individual coach UI).**

## Board

| #   | Phase                           | Status     | Pointer                                                                         |
| --- | ------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| 0   | Local legacy harness            | ✅ done    | `legacy-contract.md` (verified live); `tdp/local/docker-compose.yml` — stack UP |
| 1a  | Connector server foundation     | ✅ done    | MERGED **#317**; D-6…D-9; `endpoints/coaching/mobile-publish/`                  |
| 1b  | Coach UI (connect/link/publish) | ✅ done    | MERGED **#318**; D-10/11/12; +additive `GET`/`DELETE /links` routes             |
| 2a  | Individual server foundation    | ✅ done    | PR `feat/mobile-publish-p2a`; D-13/D-14; channel-aware seam + athletes proxy    |
| 2b  | Individual coach UI             | ⏳ next    | `plan.md` P2 — athlete picker + link-modal individual mode + grouped publish    |
| 3   | Hardening                       | ⏳ pending | `plan.md` P3 — disconnect (MP-12), token-refresh UX, P1b polish (MP-13), audit  |

## Next action

**▶ Start P2b — Individual coach UI** (UI-first on mocks, per the training-domain workflow). The server pipe is LIVE on dev (P2a): `GET /api/platform/mobile/athletes` lists the legacy Individual athletes (`GET /user?userPlanId=2`, read live, MP-6); `POST /links` accepts `{channel:"INDIVIDUAL", athleteId, legacyUserId}` (keyed on athleteId, D-13); `POST /publish` routes per-channel (DELETE+POST replace for individual, D-14). P2b builds: the **athlete picker** (the platform plan-enrollment paired against the live legacy athlete list — manual, coach-driven, no auto-match, D-2/D-3), the link-modal individual mode, the strip/publish-modal individual display (grouped by athlete, NOT "Level null"), and the client slice/hook/key (`useMobileAthletes`). Optionally bake resolved working weights (MP-2 — `athleteId` is now stored → a pure `renderRowLine` ctx follow-up).

**Before prod (P2a):** the P2a migration (2 additive folders, enum split) rides `db-migrate.yml` at merge; the **prod-snapshot dry-run of the `mobile_link_channel_key_xor` CHECK is a pre-merge owner step** (existing GENERAL rows satisfy it — `prod-data-inviolable`). Carried from P1a (still open): `MOBILE_PUBLISH_ENCRYPTION_KEY` + `LEGACY_MOBILE_API_BASE_URL` in Vercel. Re-run the gated integration anytime: `RUN_LEGACY_INTEGRATION=1` + the harness up (seed a `user_plan_id=2` athlete, see `journal.md`) + dev `DATABASE_URL` exported (sourced from `packages/api-server/.env`, wins over `.env.test`).

## Open decisions awaiting ratification

- **(none open)** — D-1…D-12 ratified. P1b added D-10 (surface placement), D-11 (unlink in / disconnect deferred), D-12 (`MOBILE_RECONNECT_REQUIRED` → contracts). P2 is the Individual channel (planner-coach lens); the disconnect cascade-semantics call (warn-and-cascade vs restrict-if-linked) is a P3 decision (MP-12), not P2.

## Gotchas a resuming session must know

- **P1a env var:** `MOBILE_PUBLISH_ENCRYPTION_KEY` (base64 32-byte, `openssl rand -base64 32`) + `LEGACY_MOBILE_API_BASE_URL` — both in `.env.example`; set them in dev `.env` + Vercel before the endpoints work. The cipher fails closed at boot on a bad key.
- **The local harness is UP** — `docker compose -f ~/projects/contrib/tdp/local/docker-compose.yml {ps,down,up -d --wait}`. Backend `localhost:8080/api/v1`; DB host `5433`. Seeded ADMIN `admin@tdp.local` / `Admin123!` (role ADMIN, plan General, level Pro=id 2). Data EPHEMERAL — re-seed recipe in `journal.md`.
- **WSL→Docker cred-bypass:** `export DOCKER_CONFIG=~/projects/contrib/tdp/local/.docker`.
- **Auth header = RAW token** (no `Bearer `) — the adapter (`rest-adapter.ts`) sends the bare `accessToken`.
- **POST is insert-only → 409**; publish emulates upsert (GET→POST/409→PUT/skip). Skip compares to LIVE legacy content (D-9), so an out-of-band iOS edit of an owned day is re-published, not silently skipped. Unowned day + `overwriteUnowned:false` → `conflict` (never clobbered).
- **Token TTL = 1 month, no refresh** → reconnect ~monthly; api-server emits a `MOBILE_RECONNECT_REQUIRED` signal on a legacy 401 / decrypt-fail (now a `@repo/contracts` constant, D-12). P1b shipped the reconnect UX (MP-4): a proactive amber expiry nudge on the connect section + an inline `ConnectMobileModal` reconnect CTA from the link manager + publish modal (`isReconnectRequired` detects it). **Disconnect (`DELETE /connections`) is NOT built** — deferred to P3 on a cascade-semantics decision (MP-12, D-11); the connect section shows "Reconnect", never "Disconnect".
- **The iOS app has in-app `CreateProgram`** — a published day can collide with a coach-typed one → the overwrite-guard (D-4/D-9) surfaces it as `conflict`.
- **Legacy is SEPARATE infra** — consume its REST API as ADMIN only; never touch its code/DB. Legacy prod DB inviolable; P1a only ever talks to localhost:8080.

## Live carry-forwards (see `deferred.md`)

MP-1 (individual identity picker — **server half done P2a**; picker UI = P2b) · MP-2 (bake resolved weights, P2-tail; athleteId now stored) · **MP-14 (Individual DELETE+POST non-atomicity — documented residual, P2-tail/P3)** · MP-3 (delete-propagation, P3) · MP-4 (token-expiry reconnect UX — **reconnect side shipped P1b**; expiry nudge + inline reconnect CTA) · ~~MP-5 (Week.startDate=Monday)~~ **CLOSED (verified)** · MP-6 (level-name drift — mitigated, read live always) · ~~MP-7 (placement)~~ **CLOSED (D-6)** · MP-8 (no legacy unique — mitigated; residual legacy TOCTOU) · MP-9 (token key rotation, P3) · MP-10 (week-publish resilience/latency, P3) · MP-11 (row notes athlete-facing? owner call) · **MP-12 (disconnect `DELETE /connections` — DEFERRED P3, cascade-blast-radius blocker, D-11)** · **MP-13 (P1b deferred polish — QA-004/007/011/020, all recoverable)** · MP-NORTH-STAR (repoint iOS → platform API — future initiative).

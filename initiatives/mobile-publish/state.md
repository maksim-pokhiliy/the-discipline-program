# mobile-publish — state (the board)

**Updated:** 2026-06-26 — **P1 MERGED (#317 P1a + #318 P1b) + publish-syntax v2 done (D-13, PR `feat/mobile-publish-syntax`).** After the first prod publishes, Денys's feedback: the synced text dropped the workout STRUCTURE (EMOM/AMRAP/round-count) + brackets/separators, scanning as a wall of text. Root cause: `projectBlock` rendered only `schema.rows` via the flat `renderRowLine`, dropping the whole Schema structural layer (`header`/`composition`/`intensity`); `parity.test.ts` asserted the drop as correct. Fixed via a schema-aware assembler (`projection/format-legacy-schema.ts`) emitting one `exercises[]` entry per schema — a structure+intensity header (once) then reps-first bracketed movement lines — composing the shared `@repo/contracts` element formatters. **D-13 reframes the D-8 SSOT to the element-formatter level; line/schema assembly is a legacy-specific view.** Projection-only (no schema/migration/contract/legacy change); re-publish self-heals our owned days (D-9 PUT), the conflict-guard protects coach-authored days. `timeCap`→`AMRAP` not `cap` (owner correction; shared-formatter twin deferred MP-14). 22 projection units green, review B+. **Next = P2 (Individual publish).** **Before prod still open:** `MOBILE_PUBLISH_ENCRYPTION_KEY` + `LEGACY_MOBILE_API_BASE_URL` in Vercel; the P1a migration rode `db-migrate.yml` at the #317 merge.

## Board

| #   | Phase                           | Status     | Pointer                                                                          |
| --- | ------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| 0   | Local legacy harness            | ✅ done    | `legacy-contract.md` (verified live); `tdp/local/docker-compose.yml` — stack UP  |
| 1a  | Connector server foundation     | ✅ done    | PR `feat/mobile-publish-p1a`; D-6…D-9; `endpoints/coaching/mobile-publish/`      |
| 1b  | Coach UI (connect/link/publish) | ✅ done    | PR `feat/mobile-publish-p1b`; D-10/11/12; +additive `GET`/`DELETE /links` routes |
| 1c  | Publish syntax v2 (readability) | ✅ done    | PR `feat/mobile-publish-syntax`; D-13; `projection/format-legacy-schema.ts`      |
| 2   | Individual publish              | ⏳ next    | `plan.md` P2 — coach links to a legacy athlete (MP-1)                            |
| 3   | Hardening                       | ⏳ pending | `plan.md` P3 — disconnect (MP-12), token-refresh UX, P1b polish (MP-13), audit   |

## Next action

**▶ Start P2 — Individual publish** (UI-first on mocks, per the training-domain workflow; see `plan.md` P2): the second link channel — a coach links a plan-enrollment to a legacy **athlete** picked from `GET /user?userPlanId=2` (MP-1, the identity-bridge picker — manual, coach-driven, no auto-matching, D-2/D-3); publish into `individual_programs` per athlete; optionally bake the athlete's resolved working weights into the text since we know his 1RMs (MP-2, P2-optional). The connector spine (P1a) + the publish/link/connect UI surfaces (P1b) are the foundation — P2 adds the Individual channel's identity picker + the per-athlete publish target. Keep reading the legacy training levels / athletes **live** (MP-6).

**Before prod (carried from P1a, still open):** set `MOBILE_PUBLISH_ENCRYPTION_KEY` + `LEGACY_MOBILE_API_BASE_URL` (with `/api/v1`) in Vercel; the P1a migration rides `db-migrate.yml` post-merge. Re-run the gated integration anytime: `RUN_LEGACY_INTEGRATION=1` + the harness up + dev `DATABASE_URL` exported.

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

MP-1 (individual identity picker = P2) · MP-2 (bake resolved weights, P2-opt) · MP-3 (delete-propagation, P3) · MP-4 (token-expiry reconnect UX — **reconnect side shipped P1b**; expiry nudge + inline reconnect CTA) · ~~MP-5 (Week.startDate=Monday)~~ **CLOSED (verified)** · MP-6 (level-name drift — mitigated, read live always) · ~~MP-7 (placement)~~ **CLOSED (D-6)** · MP-8 (no legacy unique — mitigated; residual legacy TOCTOU) · MP-9 (token key rotation, P3) · MP-10 (week-publish resilience/latency, P3) · MP-11 (row notes athlete-facing? owner call) · **MP-12 (disconnect `DELETE /connections` — DEFERRED P3, cascade-blast-radius blocker, D-11)** · **MP-13 (P1b deferred polish — QA-004/007/011/020, all recoverable)** · MP-NORTH-STAR (repoint iOS → platform API — future initiative).

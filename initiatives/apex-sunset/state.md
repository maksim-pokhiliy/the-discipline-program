# apex-sunset — state (the board)

**Updated:** 2026-08-07 (night) — **P0 CLOSED.** SSH access live (`ssh tdp-vps`), server recon done read-only, both databases dumped over SSH and restore-verified (counts exact vs live), backup cron verified alive (AS-6 closed). Key facts a resuming session must not re-derive: the legacy DB holds ZERO athlete-generated data (19 users, 640+321 program days, 4 catalogs); the app is a read-only viewer hardcoded to the apex domain (DNS takeover = free repoint); the compat surface is 9 endpoints, contract already live-verified in `mobile-publish/legacy-contract.md`; the legacy has IDOR holes AND an internet-reachable 5432 → retire FAST.

## Board

| #   | Phase                        | Status     | Pointer                                      |
| --- | ---------------------------- | ---------- | -------------------------------------------- |
| P0  | Facts & safety net           | ✅ done    | `plan.md` 0.1–0.5 all ✅; journal 2026-08-07 |
| P1  | The shim (`/api/v1/*`)       | ⬜ pending | D-1/D-4/D-5; `legacy-contract.md` = the spec |
| P2  | Accounts (full users import) | ⬜ pending | D-3; dry-run on the P0 dump first            |
| P3  | Rehearsal & cutover          | ⬜ pending | D-5 rehearsal; apex DNS → Vercel             |
| P4  | Cleanup & close-outs         | ⬜ pending | AS-4/AS-5; `mobile-publish` → superseded     |

## Next action

**▶ P0 CLOSED (2026-08-07 night).** All five steps ✅ — see journal (SSH recon, dump + restore verification, AS-6 closed). Local assets a resuming session can use: dumps at `~/projects/contrib/tdp/dumps/2026-08-07/{prod,dev}.dump`; restored snapshot container `tdp-dump-verify` (PG 17.5-alpine, databases `prod_snap`/`dev_snap`) — the P2.1 dry-run playground. **Next: P1.1 (shim foundation) via `/step`** — `/api/v1` namespace + legacy bearer wrapper + `signin` + catalogs; golden tests against the docker harness (bump harness postgres 16→17-alpine while touching it). P2.1 (users import) is unblocked by the verified dump and can follow immediately after 1.1/1.2. Owner-side ride-alongs: **AS-1** ($99 membership renewal = owner+Denys product call) · the 5432-exposure ask to Vladyslav (bind to `127.0.0.1` — breaks nothing product-side; our charter forbids us touching the server) · Trello board setup when the owner creates the workspace.

## Open decisions awaiting ratification

- **(none open)** — D-1..D-5 ratified at founding. Step-level designs (snapshot schema, id-map shape, apex routing) are deliberately deferred to their steps (`plan.md` tail list), not open decisions.

## Live carry-forwards

AS-1 (App Store Connect access — future redesign + bus factor, NOT a cutover blocker) · AS-2 (`/dev-api` dies with the VPS — DEBUG builds lose their target, accepted) · AS-3 (XCUITest smoke in CI — optional) · AS-4 (surviving `mobile-publish` UI carry-forwards re-home at P4) · AS-5 (`MobileConnection`/cipher/env-vars fate — P4 design).

## Gotchas a resuming session must know

- **The iOS app's wire traps are sacred** (charter): raw `Authorization` (no `Bearer `), HTTP 200-only success, `yyyy-MM-dd` dates everywhere, `PROGRAM_ID` header on 409, never `isRestDay:false` + `dailyProgram:null` (a `fatalError` on the app's main screen), 403 — not 401 — drives sign-out.
- **The app sends `userId: Int`** — the users import MUST preserve legacy integer ids in a map (D-3); a cuid in `JwtDTO.userId` kills the decode.
- **Do NOT patch the legacy backend** (IDOR etc.) — it dies; and legacy prod stays inviolable until the final snapshot (charter Sacred).
- `mobile-publish` is still ACTIVE in parallel until P4 closes it as superseded — don't double-book its MP- numbers; this initiative uses AS-.
- The local legacy harness (`tdp/local/docker-compose.yml`, backend `localhost:8080/api/v1`, DB host 5433) is the golden-test target — recipe in `mobile-publish/journal.md`.
- **Prod Postgres is 17.5; the harness compose pins `postgres:16-alpine`** — PG16 `pg_restore` cannot read PG17 custom-format dumps. Bump the harness image to `17-alpine` the first time a step touches it (P1.1). The restored prod snapshot lives in local container `tdp-dump-verify` (`prod_snap`/`dev_snap`).
- Real prod `users` columns (drifted from `schema.sql`): `user_role_id`, `training_level_id`, `user_plan_id`, `is_enabled` — 8 of 19 users are disabled; the shim's auth + the P2.1 import must honor disabled semantics per the legacy contract.

# apex-sunset — state (the board)

**Updated:** 2026-08-10 — **P1.2 DONE** (user endpoints, PR #367 `0f208f9e`, owner-merged; prod migration + deploy verified). `GET /user/{id}` + `PUT /user` + `PATCH /user/changePassword` live on the platform domain — the shim's first AUTHED endpoints, mounting the P1.1 bearer wrapper. Golden 35/35 vs the live harness (planner-re-run). Key facts banked: (1) **scope was 5 endpoints in the plan → 3 in reality** — `GET /user` (list) + `changeTrainingLevel` are admin-only (source-read the iOS app), so only the 3 athlete endpoints are served. (2) **changePassword has a rich per-branch wire surface** (success 200 · wrong-old **401** · same 400 · validation 400 · unknown 404) and **401 ≠ sign-out** (only 403 is) — the shim makes 403-for-a-business-failure impossible by TYPE (a `LegacyUserOutcome` union with no denied variant). (3) all three ops **scope-to-self → 404** (anti-IDOR; legacy leaks any user to any authed caller). P1.1 fact still current: **the legacy auth-failure surface is 403-empty for EVERY auth failure** (Spring Security 6 default entry point + `/error` re-dispatch swallow the explicit 401). P0: legacy DB holds ZERO athlete-generated data (19 users); app is a read-only viewer hardcoded to apex; compat surface = 9 endpoints, contract in `mobile-publish/legacy-contract.md`.

## Board

| #   | Phase                        | Status          | Pointer                                                                         |
| --- | ---------------------------- | --------------- | ------------------------------------------------------------------------------- |
| P0  | Facts & safety net           | ✅ done         | `plan.md` 0.1–0.5 all ✅; journal 2026-08-07                                    |
| P1  | The shim (`/api/v1/*`)       | 🔶 1.1+1.2 done | 1.1 ✅ (#364) · 1.2 ✅ (#367); 1.3/1.4 pending; `legacy-contract.md` = the spec |
| P2  | Accounts (full users import) | ⬜ pending      | D-3; dry-run on the P0 dump first                                               |
| P3  | Rehearsal & cutover          | ⬜ pending      | D-5 rehearsal; apex DNS → Vercel                                                |
| P4  | Cleanup & close-outs         | ⬜ pending      | AS-4/AS-5; `mobile-publish` → superseded                                        |

## Next action

**▶ P1.2 DONE (2026-08-10).** Three athlete user endpoints shipped + prod-verified (see journal). Golden recipe unchanged: `scripts/legacy-harness-seed.sh` (idempotent) → `RUN_LEGACY_INTEGRATION=1 SKIP_ENV_VALIDATION=1 pnpm exec vitest run --project platform src/app/api/v1/` (now 35 cases). The restored prod snapshot `tdp-dump-verify` (PG 17.5, `prod_snap`/`dev_snap`) is still the P2.1 dry-run playground; dumps at `~/projects/contrib/tdp/dumps/2026-08-07/`. **Next: P1.3 (publish snapshot + `GET /program`) via `/step`** — snapshot write on Publish (D-4 storage schema designed inside this step) + `GET /program?userId=&scheduledDate=` served from snapshots; the `isRestDay:false + dailyProgram:null` fatalError invariant needs an explicit test. P2.1 (users import) is unblocked (verified dump + live identity table) and now carries **AS-10** (catalog-id validation on import). Owner-side ride-alongs unchanged: **AS-1** ($99 membership) · the 5432-exposure ask to Vladyslav · Trello board setup · **AS-9** (prod rate limiting no-op — Upstash unset in Vercel — owner decides; RF-2 already fixed so wiring it later is safe).

## Open decisions awaiting ratification

- **(none open)** — D-1..D-7 ratified. P1.2's design calls (scope-to-self→404, the no-403 outcome union, min-12 policy, +2 identity columns, tokenVersion bump) were planner-ratified at the plan gate and recorded in the journal; none rose to a new D-number. Remaining step-level designs (publish-snapshot schema at 1.3, apex routing at 3.2) are deferred to their steps.

## Live carry-forwards

AS-1 (App Store Connect access — future redesign + bus factor, NOT a cutover blocker) · AS-2 (`/dev-api` dies with the VPS, accepted) · AS-3 (XCUITest smoke in CI — optional) · AS-4 (surviving `mobile-publish` UI carry-forwards re-home at P4) · AS-5 (`MobileConnection`/cipher/env-vars fate — P4 design) · **AS-7** (bcrypt timing oracle cost 10-vs-12 — fix rides the P2.1 import) · **AS-8** (golden cold-start flake on pooled Neon — the P1.2 warmup mitigates it but is ordering-dependent (RF-5); a future lazy-token-minting refactor would silently reintroduce it; local-isolation still open) · **AS-9** (prod rate limiting no-op — Upstash absent in Vercel; owner decision) · **AS-10** (the shim 500s on an identity whose legacy catalog id is out-of-range — the P2.1 import MUST validate role/plan/level ids so no imported row carries one).

## Gotchas a resuming session must know

- **The iOS app's wire traps are sacred** (charter): raw `Authorization` (no `Bearer `), HTTP 200-only success, `yyyy-MM-dd` dates everywhere, `PROGRAM_ID` header on 409, never `isRestDay:false` + `dailyProgram:null` (a `fatalError` on the app's main screen), 403 — not 401 — drives sign-out.
- **The app sends `userId: Int`** — the users import MUST preserve legacy integer ids in a map (D-3); a cuid in `JwtDTO.userId` kills the decode.
- **Do NOT patch the legacy backend** (IDOR etc.) — it dies; and legacy prod stays inviolable until the final snapshot (charter Sacred).
- `mobile-publish` is still ACTIVE in parallel until P4 closes it as superseded — don't double-book its MP- numbers; this initiative uses AS-.
- The local legacy harness (`tdp/local/docker-compose.yml`, backend `localhost:8080/api/v1`, DB host 5433) is the golden-test target — recipe in `mobile-publish/journal.md`.
- **Prod Postgres is 17.5; the harness compose pins `postgres:16-alpine`** — PG16 `pg_restore` cannot read PG17 custom-format dumps. Bump the harness image to `17-alpine` the first time a step touches it (P1.1). The restored prod snapshot lives in local container `tdp-dump-verify` (`prod_snap`/`dev_snap`).
- Real prod `users` columns (drifted from `schema.sql`): `user_role_id`, `training_level_id`, `user_plan_id`, `is_enabled` — 8 of 19 users are disabled; the shim's auth + the P2.1 import must honor disabled semantics per the legacy contract.

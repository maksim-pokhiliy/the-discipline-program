# apex-sunset — state (the board)

**Updated:** 2026-08-07 — **Initiative FOUNDED.** Full recon done (3 parallel agents: legacy backend, iOS app, platform surface — distillate in `journal.md`); strategy ratified as D-1..D-5. Key facts a resuming session must not re-derive: the legacy DB holds ZERO athlete-generated data (users + catalogs + free-text program days only); the app is a read-only viewer hardcoded to the apex domain (DNS takeover = free repoint); the compat surface is 9 endpoints, contract already live-verified in `mobile-publish/legacy-contract.md`; the legacy has IDOR holes → retire FAST.

## Board

| #   | Phase                        | Status     | Pointer                                      |
| --- | ---------------------------- | ---------- | -------------------------------------------- |
| P0  | Facts & safety net           | ⬜ pending | `plan.md` 0.1–0.5; ADR absorb-and-retire     |
| P1  | The shim (`/api/v1/*`)       | ⬜ pending | D-1/D-4/D-5; `legacy-contract.md` = the spec |
| P2  | Accounts (full users import) | ⬜ pending | D-3; dry-run on the P0 dump first            |
| P3  | Rehearsal & cutover          | ⬜ pending | D-5 rehearsal; apex DNS → Vercel             |
| P4  | Cleanup & close-outs         | ⬜ pending | AS-4/AS-5; `mobile-publish` → superseded     |

## Next action

**▶ P0** — one session: `git fetch` both clones (0.1) + bcrypt compatibility check on the harness (0.4) + draft the absorb-and-retire ADR (0.5). Owner-side in parallel: VPS/DNS access + read-only prod `pg_dump` (0.2/0.3) — the dump is the P2 dry-run input, so P2 is blocked until it exists.

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

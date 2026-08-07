# apex-sunset — decisions

D-numbered ratified decisions. Step-level calls that don't merit a full ADR live here;
cross-initiative architecture calls go to `docs/adr/`. **Promote here at every gate.**
This file is the SSOT for "why."

**Status legend:** `RATIFIED` · `OPEN` · `SUPERSEDED`.

## Index

| ID  | Topic                                                                                  | Status   |
| --- | -------------------------------------------------------------------------------------- | -------- |
| D-1 | Absorb & retire via compat shim + domain takeover; zero Swift changes                  | RATIFIED |
| D-2 | The iOS app is a production surface, NOT legacy; redesign later, no sunset             | RATIFIED |
| D-3 | Users import: ALL rows, no activity filter; legacy integer id preserved                | RATIFIED |
| D-4 | Publish becomes a snapshot in our DB; the shim serves snapshots                        | RATIFIED |
| D-5 | E2E harness: golden contract tests + Appetize stand + prod-build rehearsal             | RATIFIED |
| D-6 | Legacy identity = separate `MobileLegacyIdentity` table; schema pulled forward to P1.1 | RATIFIED |
| D-7 | Shim wire schemas live api-server-local — a stated ADR-0005 exception                  | RATIFIED |

---

### D-1 — Absorb & retire via compat shim + domain takeover; zero Swift changes

- **Status:** RATIFIED (owner, 2026-08-07 — "Лучше не придумает никто — го").
- **Decision.** The legacy Spring backend, its Postgres, and the VPS are decommissioned. The platform serves the legacy wire contract itself: `/api/v1/*` compat endpoints (the 9 the app actually calls) + a bearer wrapper honoring the raw-token header, behind the apex domain `thedisciplineprogram.com` repointed from the VPS to Vercel. The iOS app is not modified — not one line, not one release.
- **Rationale.** Recon (2026-08-07, three parallel agents) established: the legacy DB has ZERO athlete-generated data (7 tables: users + 4 catalogs + two program-day tables, ~hundreds of free-text rows) and zero integrations (no APNs — the payment reminder is a LOCAL `UNCalendarNotificationTrigger`; no email/storage/cron); the app is a 3.8k-LoC read-only viewer with the base URL hardcoded to the apex domain, so a DNS takeover repoints it for free; the compat surface is 9 endpoints whose contract is already verified live (`legacy-contract.md`); and the legacy has IDOR holes (any authenticated athlete can PUT/DELETE any user; `GET /user` leaks full PII; unauthenticated `changePassword`) — an argument for retiring it FAST. Option B (rewrite the app's data layer) invests in a prototype-grade codebase and needs an App Store release; option C (sunset the app) rejected per D-2.
- **Links.** `mobile-publish/deferred.md` MP-NORTH-STAR; `mobile-publish/decisions.md` D-1; ADR-0020 §1; `legacy-contract.md`; journal 2026-08-07.

### D-2 — The iOS app is a production surface, NOT legacy; redesign later, no sunset

- **Status:** RATIFIED (owner, 2026-08-07).
- **Decision.** "Legacy" = the Spring backend + its DB ONLY — burned to the ground. The iOS app is a production client with real users: "по уровню — прототип, по функции — продукт". The athlete's strategic interface is the phone ("в зале все с телефонами, никого с лептопами"); the web platform is the coach's tool; PWA is not an answer for this audience. The client's future = a mobile-app REDESIGN on top of a real mobile API — a separate FUTURE initiative, opened when it hurts ("не сейчас, потому что это не болит"). This initiative's shim (bearer wrapper + `/api/v1`) is that redesign's foundation, not a competitor.
- **Rationale.** Product/UX call, owner's domain. The pain being treated NOW is two backends + publish shamanism — both die with the shim at zero Swift cost; the client question carries no urgency once the backend is unified. Supersedes the planning dialogue's initial "sunset as trajectory" lean.
- **Links.** memory `mobile-app-is-product-not-legacy`; journal 2026-08-07.

### D-3 — Users import: ALL rows, no activity filter; legacy integer id preserved

- **Status:** RATIFIED (owner, 2026-08-07 — "юзеры в базе просто есть и должны быть").
- **Decision.** Every legacy `users` row is imported as a platform `User` (ATHLETE unless mapped otherwise). No activity inventory, no pruning. The legacy integer id is preserved in a mapping (column or table — step-level call): the app stores `userId: Int` in UserDefaults and sends it on every request (`GET /program?userId=`, `GET /user/{id}`), and `JwtDTO.userId` must decode as Int — a cuid would kill the decode.
- **Rationale.** Owner directive. Both stacks hash with bcrypt (Spring `BCryptPasswordEncoder` strength 10) — password hashes are expected to carry over so athletes log in with their OLD password; P0 verifies the format compatibility against our credentials validator before the import is specced.
- **Links.** `legacy-contract.md` (signin shape); iOS recon (UserDefaults/Keychain layout); journal 2026-08-07.

### D-4 — Publish becomes a snapshot in our DB; the shim serves snapshots

- **Status:** RATIFIED (owner, 2026-08-07 — direction; storage shape is a step-level design).
- **Decision.** "Publish" stops being a network push into a foreign API. It renders the day (the existing tested projection) and stores the result as a SNAPSHOT in our DB; the shim's `GET /program` serves snapshots. Not chosen: serve-time live render of the plan tree.
- **Rationale.** Snapshot preserves the coach semantics 1:1 — the athlete sees what the coach SENT, not a live draft; the D-18 status machinery keeps its meaning (our DB is now the truth it reports on). The projection (`project-day.ts` + parity/golden tests) is reused as-is; `MobilePublishedDay` already ledgers per-(link, day) — the snapshot extends that model (exact schema = step design in P1).
- **Links.** `mobile-publish/decisions.md` D-9/D-13/D-17/D-18; journal 2026-08-07.

### D-5 — E2E harness: golden contract tests + Appetize stand + prod-build rehearsal

- **Status:** RATIFIED (owner, 2026-08-07 — "если есть способ — нужно постараться сделать").
- **Decision.** Three layers, no Mac required (owner is on Windows/WSL):
  1. **Golden contract tests** (mandatory P1 gate): shim vs the live legacy docker harness, byte-for-byte, all 9 endpoints on one seed.
  2. **Appetize stand** (the manual e2e bench): a signing-free simulator build (`CODE_SIGNING_ALLOWED=NO`) on a GitHub Actions macOS runner from OUR fork (CI patches the hardcoded base URL to the shim/preview — test build only, D-2 non-goal untouched), streamed interactively in the browser via Appetize.io.
  3. **Prod-build rehearsal** (P3, before DNS cutover): the real App-Store build on a real iPhone via LAN DNS-override (dnsmasq) + a genuine cert for the apex domain (DNS-01 via Cloudflare) on a local proxy forwarding to the shim.
     Optional 4th: XCUITest smoke in CI (`deferred.md` AS-3).
- **Rationale.** Golden tests catch more regressions than eyes; Appetize gives a literal "поднять экземпляр апки" from a Windows browser; the rehearsal proves the exact production binary against the shim before the irreversible-feeling DNS flip. After cutover, every phone running the app IS the e2e.
- **Links.** iOS recon (build/signing facts); journal 2026-08-07.

### D-6 — Legacy identity = a separate `MobileLegacyIdentity` table; the schema is pulled forward to P1.1

- **Status:** RATIFIED (owner ratified the pull-forward at the P1.1 contour, 2026-08-08; shape ratified by the planner at the plan gate).
- **Decision.** The legacy integer id + the legacy-only attributes live in a dedicated `MobileLegacyIdentity` table (1:1 FK → `User`, Cascade), NOT columns on `User`: `legacyUserId Int @unique`, `legacyRoleId`/`legacyPlanId`/`legacyLevelId Int` (all NOT NULL), `isEnabled Boolean @default(false)`, `firstName?`/`lastName?`. The map's SCHEMA is created at P1.1 because `signin` must emit `userId: Int` immediately; only its POPULATION + reconciliation stay at P2.1 (D-3). In prod the table is EMPTY until P2.1.
- **Rationale.** Six-plus legacy-only attributes would pollute the core `User`; a dedicated table deletes cleanly at the future app redesign (ADR-0043 = absorb _and retire_). `legacyLevelId` is NOT NULL because the prod column is `NOT NULL DEFAULT 1` — the step prompt's suggested `Int?` modeled a state the source cannot produce and was superseded. `isEnabled` defaults false (fail-closed). This resolves the plan's deferred "id-map shape: column vs table" question in favor of a table.
- **Links.** `plan.md` 1.1 + deferred design-tail; design.md D-5/D-6; D-3; journal 2026-08-08.

### D-7 — Shim wire schemas live api-server-local — a stated ADR-0005 exception

- **Status:** RATIFIED (planner, 2026-08-08; stated in PR #364's body).
- **Decision.** The shim's request/response/params zod schemas live inside `endpoints/mobile-compat/` in `api-server`, NOT in `@repo/contracts`. The `jose` dep and the token + env modules also land in api-server (not `@repo/api-routes`), which keeps the whole compat surface in one deletable folder.
- **Rationale.** ADR-0005 mandates all contract schemas in `@repo/contracts`, but that rule exists to SHARE schemas with TypeScript clients. The shim has no TS client — its consumer is the Swift app, over the wire — so the sharing benefit is nil, while the cost (a permanent legacy-shaped surface spread across `@repo/contracts`) is real. Self-containment serves the retire half of ADR-0043: the redesign deletes a directory, an exports entry, and a route folder. `api-routes` also has no `@repo/env` dependency today, so the bearer wrapper takes an injected resolver composed in the app rather than importing api-server (dep-cruiser `api-routes-no-api-server`).
- **Links.** ADR-0005; design.md D-1/D-2; PR #364; journal 2026-08-08.

# apex-sunset — charter

**Status: founded 2026-08-07; in `initiatives/ACTIVE` since 2026-08-07.**

**Goal.** One product, one ecosystem: the legacy Spring backend ("apex") and its Postgres are decommissioned; the platform (`api-server` + Neon) becomes the ONLY backend and the ONLY database — and the live App-Store iOS app keeps working **without a single Swift change**, served by a platform-side compatibility shim behind the apex domain.

**Driving decision(s).** `mobile-publish` MP-NORTH-STAR (deferred.md — "build legacy-contract-compatible endpoints, migrate accounts, retire the Java backend") and its D-1, which named this the "eventual north star" blocked on the legacy dev's unavailability — that blocker is lifted (owner, 2026-08-07: Denys agreed, Vladyslav не против). ADR-0020 §1 pre-ratified `/api/v1/*` URL versioning "on the first external consumer (mobile app)". A new ADR (absorb-and-retire) is P0's first deliverable — the first ADR on the legacy integration.

**Why the shim (route A), not the alternatives.** B (rewrite the app's data layer against a clean mobile API) invests in a prototype-grade codebase (zero tests, no offline, iOS 18+, manual Xcode releases, author gone) and requires an App Store release just to break even. C (sunset the app, athletes on web) was REJECTED by the owner as product direction — see D-2. A unifies the backend NOW at zero Swift cost: the 9-endpoint wire contract is already reverse-engineered and live-verified (`initiatives/mobile-publish/legacy-contract.md`), and the day-render projection already exists as tested code.

**Acceptance criteria (properties, not tasks).**

- An athlete opens the unchanged App-Store app, logs in with their OLD password, and sees their published day — while the Spring backend is OFF and every byte comes from Neon.
- The apex domain (`thedisciplineprogram.com/api/v1/*`) is served by our infrastructure; the VPS (prod backend + `/dev-api` twin + its Postgres) is down; a final `pg_dump` of both schemas is archived.
- Every legacy user exists as a platform `User` with their legacy integer id mapped (the app stores `userId: Int` and sends it on every request).
- Coach Publish reflects in the app without any network push to a foreign API — the shim serves publish SNAPSHOTS from our DB (D-4); the coach-side publish semantics (D-18 statuses) are unchanged.
- Golden contract tests (shim vs live legacy harness, byte-for-byte, all 9 endpoints) are green; the real app has been driven end-to-end against the shim (Appetize stand + prod-build DNS-override rehearsal).
- The connector-era complexity class is deleted: monthly reconnect ritual, AES token cipher + rotation, legacy TOCTOU workarounds, DELETE+POST non-atomicity — `mobile-publish` MP-4/8/9/10/12/15 closed "by decommission".

**Scope.** Compat shim `/api/v1/*` (9 endpoints per the verified contract) + a bearer wrapper honoring the legacy raw-token format · full users import (ALL rows, no activity filter — D-3) with a legacy-id map · publish-snapshot model (D-4) · apex DNS cutover to Vercel · decommission of prod + `/dev-api` + VPS · connector teardown + `mobile-publish` close-out as superseded · e2e stands (golden tests, Appetize, DNS-override rehearsal).

**Non-goals (→ where they go).**

- Mobile-app redesign, features, or any product Swift work → a FUTURE client-redesign initiative, opened when it hurts (D-2). Test-only builds (CI base-URL patch for the Appetize stand) are allowed; product changes are not.
- A full public mobile API / token-flow product beyond what the shim needs → the redesign initiative inherits the shim's bearer foundation.
- Importing historical free-text program days into Neon → archived in the final dump only; the platform is the author of everything new.
- Fixing legacy-side defects (IDOR, broken Individual PUT) → they die with the backend; do not patch a corpse.

**Sacred (do not touch).**

- **The iOS app's production behavior must not change by a byte.** The wire traps are named and non-negotiable: raw `Authorization` header (no `Bearer ` prefix) · HTTP **200-only** success (a 201/204 is a failure to the app) · `yyyy-MM-dd` on every date field · the `PROGRAM_ID` response header on 409 · NEVER emit `isRestDay:false` with `dailyProgram:null` (a literal `fatalError` in `ProgramView.swift:53`) · 403 (not 401) drives sign-out.
- **Prod data on BOTH sides is inviolable** until the final archived snapshot: no deletes/writes in legacy prod beyond what the existing connector already does; Neon per standing rules.
- The coach publish semantics ratified in `mobile-publish` D-18 (week vs lifetime statuses) survive the mechanism swap.
- The app stays a production client with real users (D-2) — no "temporary" degradation is acceptable during cutover.

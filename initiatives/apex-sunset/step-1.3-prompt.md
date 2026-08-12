# Step 1.3 — publish snapshot + program serve (apex-sunset P1.3)

Invoke the `/feature` skill with everything below as its argument, and run its full
pipeline: research → plan (STOP at the plan gate and report to the PLANNER session that
spawned you — not the repo owner) → implement → internal review → PR. This file is skill
INPUT, not a plan override: /feature's own research/planning still runs; where this file
pins a fact verbatim (especially the LIVE-VERIFIED wire tables), trust it over guessing,
and verify anchors against the tree.

## Mission

Give the compat shim (ADR-0043) the athlete's READ surface: `GET /api/v1/program`, served
from a publish SNAPSHOT stored in OUR database (D-4). Two halves:

1. **Snapshot storage + write** — Publish stores the rendered day's CONTENT in our DB
   (today `MobilePublishedDay` is a per-link LEDGER whose content lives in the foreign
   legacy DB). The legacy push stays (it feeds the live app until cutover — Sacred); this
   step ENRICHES the ledger row we already write with the content.
2. **Serve** — `GET /api/v1/program?userId=&scheduledDate=` returns the snapshot in the
   exact legacy wire shape, so the unchanged iOS app renders it byte-for-byte.

The load-bearing invariant this step exists to pin: the app calls `fatalError` (a literal
crash on its main screen) if it ever receives `isRestDay:false` with `dailyProgram:null`
(`ProgramView.swift:53`). The shim must make that state unrepresentable — at the DB layer
AND the serializer — and prove it with an explicit test.

## Read before planning

- `initiatives/apex-sunset/{charter.md,decisions.md,state.md}` — sacred wire traps + D-1..D-7
  (esp. **D-4** publish-as-snapshot, **D-6** identity table, **D-7** schemas api-server-local).
- `initiatives/mobile-publish/legacy-contract.md` — the verified contract; the `daily_program`
  JSONB shape + the `is_rest_day XOR daily_program` CHECK + the general/individual channels.
- The P1.1/P1.2 shim you extend (all on `main`):
  - `packages/api-routes/src/legacy-shim/` — the bearer wrapper + `responses.ts`
    (`renderLegacyUserOutcome` — the exhaustive no-403 switch you mirror), `types.ts`
    (`LegacyShimIdentity`, `LegacyUserOutcome`, `LegacyShimHandler`), exported at
    `@repo/api-routes/legacy-shim`.
  - `packages/api-server/src/endpoints/mobile-compat/` — `wire-handlers.ts` (route wiring;
    `signin` shows the DENIED-inline guard for a malformed request), `wire-schemas.ts`
    (add the program DTO types here — D-7), `get-user.ts` (the scope-to-self→404 pattern —
    COPY it), `identity-resolver.ts` (D-11 soft-delete-safe; REUSE), `legacy-catalogs.ts`
    (`LEGACY_TRAINING_LEVELS` + `findLegacyCatalogEntry` — the `trainingLevel.name` source),
    `create-mobile-compat-api.ts`, `index.ts`.
  - `apps/platform/src/app/api/v1/` — the P1.1/P1.2 route files (esp. `user/[id]/route.ts` =
    the `withPublicRoute(withMobileBearerAuth(...))` delegate pattern) + `mobile-shim-auth.ts`.
  - `apps/platform/src/app/api/v1/__tests__/shim-golden.integration.test.ts` — the golden you
    EXTEND (do NOT rewrite); note the `api/v1 route mounting` + verb tests you must update.
- The reusable projection + publish path (the write half):
  - `packages/api-server/src/endpoints/coaching/mobile-publish/projection/project-day.ts` —
    `projectDay` returns `{isRestDay:true} | {isRestDay:false; dailyProgram}` (the fatal state
    is already unrepresentable in its type) + `parity.test.ts` (proves it equals the legacy
    shape — REUSE, do not re-derive the shape).
  - `packages/api-server/src/endpoints/coaching/mobile-publish/publish-day.ts` — `recordPublishedDay`
    (runs on every publish, already holds the pushed row) — this is where the content write lands.
  - `packages/api-server/src/endpoints/coaching/mobile-publish/channel-program-ops.ts` +
    `.../day-include.ts` + `.../links.ts` (`loadPublishAggregates` groupBy `linkId` — the
    coach-facing ledger use you must NOT break).
  - `packages/api-server/src/infrastructure/legacy-mobile/port.ts` — `LegacyDailyProgram`,
    `LegacyGeneralProgram`, `LegacyIndividualProgram` types.
- `packages/api-server/prisma/schema.prisma` — `MobilePublishedDay` (you add 2 columns + a
  CHECK), `MobilePublishLink` (channel + `legacyLevelId`/`legacyUserId` routing keys),
  `MobileLegacyIdentity` (the token identity: `legacyUserId`/`legacyPlanId`/`legacyLevelId`).
- Legacy source (read-only, NEVER edit): `~/projects/contrib/tdp/mobile-backend/backend/` —
  `controllers/program/ProgramController`, `services/program/{ProgramServiceImpl,
GeneralProgramServiceImpl,IndividualProgramServiceImpl}`, `models/dtos/program/*`.
- iOS (read-only): `~/projects/contrib/tdp/mobile-ios/.../Network/ProgramService.swift`,
  `Views/Program/ProgramView.swift` (the fatalError site + the 404/403 error branches),
  `Models/Program/{Program,DailyProgram}.swift`, `Utilities/BaseCoders/BaseDecoder.swift`.

## LIVE-VERIFIED wire surface (probed against the harness 2026-08-12 — AUTHORITATIVE)

Captured with `curl` against the live legacy backend at `localhost:8080/api/v1` with a
VALID athlete token. The step prompt's job is to stop you re-deriving these from Java (P1.1
and P1.2 both taught us the source-declared statuses are wrong on the wire). The golden
re-pins them vs the harness; the shim mirrors them for the APP-EXERCISED cases and diverges
only where a hardening delta is documented.

### `GET /api/v1/program?userId=<int>&scheduledDate=<yyyy-MM-dd>` (bearerAuth)

| Case                                         | Status  | Body                                                                                 |
| -------------------------------------------- | ------- | ------------------------------------------------------------------------------------ |
| own General **training** day                 | **200** | general shape (below)                                                                |
| own General **rest** day                     | **200** | `{…,"isRestDay":true,"dailyProgram":null}`                                           |
| own Individual day                           | **200** | individual shape (below)                                                             |
| no program for that date                     | **404** | `text/plain` Spring message (app + golden IGNORE the body)                           |
| **malformed** `scheduledDate` (`not-a-date`) | **403** | **empty** ⚠️ — see surprise #1                                                       |
| **missing** `scheduledDate`                  | **403** | **empty** ⚠️                                                                         |
| missing both params                          | **403** | **empty**                                                                            |
| another user's `userId`, valid token         | **200** | legacy IDOR: serves the OTHER athlete's program — shim MUST NOT reproduce (delta #1) |
| unknown `userId` (no such user)              | **404** | `text/plain` `User not found with id: …`                                             |
| no `Authorization` header                    | **403** | empty (the sign-out trap)                                                            |
| `Bearer `-prefixed token                     | **403** | empty (raw-token trap — P1.1 wrapper already strips a single leading `Bearer`)       |

Verbatim 200 bodies (byte truth):

```
general training: {"id":1,"scheduledDate":"2026-08-15","trainingLevel":{"id":2,"name":"Pro"},"isRestDay":false,"dailyProgram":{"dayTrainings":[{"trainingNumber":1,"blocks":[{"name":"STRENGTH","exercises":["5 sets [ choose weight ]:\n3 bench presses"]}]}]}}
general rest:     {"id":2,"scheduledDate":"2026-08-16","trainingLevel":{"id":2,"name":"Pro"},"isRestDay":true,"dailyProgram":null}
individual:       {"id":1,"isRestDay":false,"dailyProgram":{"dayTrainings":[{"trainingNumber":1,"blocks":[{"name":"WOD","exercises":["21-15-9 thrusters"]}]}]},"scheduledDate":"2026-08-15","userId":1004}
```

- **General shape** = `{id, scheduledDate, trainingLevel:{id,name}, isRestDay, dailyProgram}`.
- **Individual shape** = `{id, userId, scheduledDate, isRestDay, dailyProgram}` (note the wire
  field ORDER differs from general — Jackson quirk; irrelevant, the iOS decoder is keyed and
  the golden canonicalizes keys, exactly as for the user endpoints).
- `id` = an INTEGER, **per-table** (general.id and individual.id both start at 1 and coexist —
  NOT globally unique). `scheduledDate` = `"yyyy-MM-dd"`. `dailyProgram` = the
  `{dayTrainings:[{trainingNumber, blocks:[{name, exercises:[string]}]}]}` JSONB, or `null` on
  a rest day. `trainingLevel.name` from the P1.1 catalog by the athlete's `legacyLevelId`.

### Three surprises the live probe caught (do NOT trust the Java on these)

1. **Any request-binding failure → 403-empty, not 400.** A malformed date, a missing
   `scheduledDate`, a missing `userId` — all return **403 with an empty body**, the same
   Spring Security 6 `/error` re-dispatch swallow as P1.1's auth failures. And **403 drives
   sign-out** in the app. Unreachable via the app (`ProgramService.loadProgram` always sends
   an Int `userId` + a `yyyy-MM-dd` date), but the golden probes it — so the shim's param
   guard must emit **403** (the DENIED path, exactly like `signin` on a non-JSON body), NOT
   the shim's natural 400. A `bad-request` outcome for `/program` is WRONG.
2. **The wire `id` is a legacy DB row PK (Int), not something we own.** Reuse the existing
   `MobilePublishedDay.legacyRowId Int` as the wire id — during this step's overlap the legacy
   is alive and `legacyRowId` holds the real legacy PK, so the shim can serve a byte-identical
   `id` (seed the golden's snapshot `legacyRowId` = the legacy row's actual id). Post-cutover
   minting is out of scope (carry-forward below).
3. **`dailyProgram` byte-parity is already a solved problem** — `projectDay` + `parity.test.ts`
   prove our projection equals the legacy JSONB. Do NOT hand-roll a second shape; store and
   serve the projection output as-is.

### iOS decode contract (why the required fields are non-negotiable)

`Program` (`Models/Program/Program.swift`) via `BaseDecoder` (date strategy
`.formatted("yyyy-MM-dd")`): **required** = `id:Int`, `scheduledDate:Date`, `isRestDay:Bool`;
optional = `trainingLevel?`, `userId?`, `dailyProgram?`. Omitting any of the three required
fields fails the decode → the app shows "something went wrong" (a synthesized 422, not a
crash). Always emit `id` (int), `scheduledDate` (yyyy-MM-dd), `isRestDay` (bool).

## Deliverables

### 1) Schema: content on `MobilePublishedDay` (additive migration + CHECK)

Add `isRestDay Boolean?` + `dailyProgram Json?` to `MobilePublishedDay`. **Nullable** because
this table is ALREADY POPULATED (the mobile-publish connector writes ledger rows in prod) —
existing rows carry null content and stay valid. Wire id stays `legacyRowId` (no new column).

Add a raw-SQL CHECK in the migration (Prisma doesn't model CHECK) enforcing the legacy XOR
**when content is present**, which makes the fatalError state unrepresentable at the DB layer:

```
ALTER TABLE "app_mobile_published_days"
  ADD CONSTRAINT "app_mobile_published_days_rest_xor_program"
  CHECK ("isRestDay" IS NULL OR ("isRestDay" = ("dailyProgram" IS NULL)));
```

(Verify the exact quoted column identifiers against the generated migration.) Author offline
via `migrate diff` (memory `offline-prisma-migration-authoring`), apply to dev Neon (standing
approval), NEVER prod; `db:generate` clean. Prod migration rides `db-migrate.yml` on merge.

### 2) api-server: the `getProgram` service in `endpoints/mobile-compat/`

A new `get-program.ts` (+ `program-dto.ts`/serializer as the shape warrants), composed into
`create-mobile-compat-api.ts`. Logic, resolving EVERYTHING from the TOKEN identity (anti-IDOR):

- **Scope-to-self:** the query `userId` must equal `identity.legacyUserId`; else `not-found`
  (404) — COPY `get-user.ts` (log a `scope_mismatch` warn). Never 403 (would sign the athlete out).
- **Channel resolution** from `identity.legacyPlanId`: `2` → Individual (route key =
  `identity.legacyUserId`), else → General (route key = `identity.legacyLevelId`).
- **Read** the servable snapshot: `MobilePublishedDay` joined to `MobilePublishLink` on
  `channel` + the route key + `scheduledDate`, `isRestDay` IS NOT NULL, ordered
  `publishedAt DESC`, take 1. Rationale for the tiebreak: legacy holds one row per
  (level/user, date) with last-write-wins; our per-link ledger can hold >1 (two plans → the
  same level), so latest-published wins = legacy semantics. (Keep `MobilePublishedDay`'s
  per-link grain — `links.ts` groupBy `linkId` depends on it.)
- **Serialize** to the exact wire shape: General →
  `{id: legacyRowId, scheduledDate, trainingLevel: {id: legacyLevelId, name}, isRestDay, dailyProgram}`
  (`name` via `findLegacyCatalogEntry(LEGACY_TRAINING_LEVELS, legacyLevelId)`); Individual →
  `{id: legacyRowId, userId: legacyUserId, scheduledDate, isRestDay, dailyProgram}`. `dailyProgram`
  = the stored Json as-is (rest day → null). Dates → `yyyy-MM-dd`.
- **fatalError guard (fail-loud):** if a read row has `isRestDay === false && dailyProgram == null`,
  throw `InternalServerError` (→ 500) rather than emit the fatal shape. 500 → the app's
  "something went wrong", NEVER a crash and NEVER 403. (The DB CHECK already prevents the row;
  this is defense-in-depth at the domain boundary.)
- Outcome: `ok-json` (200) | `not-found` (404). No other business status.

### 3) api-routes: a `LegacyProgramOutcome` + exhaustive renderer

In `packages/api-routes/src/legacy-shim/` add `LegacyProgramOutcome<T> = {kind:'ok-json';
payload} | {kind:'not-found'}` (types.ts) + `renderLegacyProgramOutcome` (responses.ts,
exhaustive switch, no default) + export it. Mirror the P1.2 discipline: NO `denied`/`bad-request`
variant on the business outcome, so a 403-for-a-business-outcome is a compile error. The
malformed/missing-param 403 is a SEPARATE handler-level guard (see #4), not an outcome.

### 4) api-server wire-handler + apps/platform route

- `wire-handlers.ts`: a `getProgram` handler (`LegacyShimHandler`). Parse `userId` (int) +
  `scheduledDate` (`yyyy-MM-dd`) from `request.url` searchParams. On ANY parse failure →
  `renderLegacyShimOutcome(DENIED)` (403, matching legacy's re-dispatch — surprise #1),
  exactly as `signin` returns DENIED on a non-JSON body. On success →
  `renderLegacyProgramOutcome(await api.getProgram(identity, userId, scheduledDate))`.
- `apps/platform/src/app/api/v1/program/route.ts`: `export const GET =
withPublicRoute(withMobileBearerAuth(mobileCompatRoutes.getProgram))` — a thin delegate per
  `user/[id]/route.ts`. Query params (not path) → no `[…]` folder.
- Update the golden's `api/v1 route mounting` assertion to include `/program`, and the verb
  `it.each` with `["program", "GET", "POST"]`.

### 5) Write path: `recordPublishedDay` stores content (the D-4 write half)

Extend `recordPublishedDay` (publish-day.ts) to persist `isRestDay` + `dailyProgram` from the
legacy row it points at (its three callers each hold the full `LegacyProgramRow` — `outcome.row`,
`raced`, `legacyRow` — so store `{isRestDay: row.isRestDay, dailyProgram: row.dailyProgram}`
alongside `legacyRowId`+`contentHash`). This stores what is LIVE on legacy for that key (on a
skip-unowned that's the observed row, not our projection — faithful to what the athlete sees).
The legacy push (`args.ops`) is UNTOUCHED — it feeds the live app until cutover; its removal is
P4.1. Extend the publish-day tests to assert the content lands on the ledger row.

### 6) Golden: extend (do NOT rewrite)

Add a `/program` block to `shim-golden.integration.test.ts`. Per side:

- **Shim side (Neon):** seed the snapshot via a new test-helper factory that builds the
  chain a read needs (coach `User`+`CoachProfile` → `MobileConnection` → `MobilePublishLink`
  with the channel + route key → `MobilePublishedDay` with `legacyRowId` = the legacy row's
  actual id, `isRestDay`, `dailyProgram`). Clean up in `afterAll` (extend the existing
  `createdUserIds` teardown; delete the connection/link/day too).
- **Legacy side (harness):** in `beforeAll`, sign in as `admin@tdp.local` and POST the matching
  `generalProgram`/`individualProgram` rows (capture the returned `id` to align the snapshot's
  `legacyRowId`), so `GET /program` on both sides is byte-comparable. The seed script TRUNCATEs
  program rows, so create what you assert. To probe the Individual channel you need a plan-2
  user; seed one via SQL in the harness (fixed committed bcrypt hash — AS-8 sibling; never
  htpasswd-random) or extend `scripts/legacy-harness-seed.sh` (keep it idempotent).
- **Case matrix (minimum):** own General training → 200 + canonical-JSON equality (incl. `id`
  if aligned; else null `id` in the compare like signin nulls `accessToken`); own General rest →
  200 `{isRestDay:true,dailyProgram:null}`; own Individual → 200 + equality; no-day → 404 both;
  IDOR (my token, another athlete's `userId`) → **shim 404 / legacy 200** (assert the intended
  divergence, do NOT assert equality); malformed date → **403 both**; no-token → 403 both.
- Planner re-runs the full gated golden independently (reviewers skip it for remote-Neon safety).

### 7) The fatalError invariant test (explicit — the P1.3 gate)

Two guards, two proofs: (a) a unit test that the serializer THROWS on
`{isRestDay:false, dailyProgram:null}` and never emits that shape; (b) an integration/migration
test that the DB CHECK REJECTS an insert of `isRestDay=false, dailyProgram=null` (raw SQL).
Name them so the invariant is greppable.

## Deliberate hardening deltas (documented, app-invisible — NOT bugs; do not "fix to match legacy")

The app only ever reads its OWN `userId` with a valid token + a well-formed date, so every
delta is unreachable in production. Document each in the PR body (the P1.1/P1.2 pattern).

1. **Scope-to-self → 404.** Resolve the acting athlete from the TOKEN, not the query `userId`;
   a foreign/unknown `userId` → 404 (legacy IDOR-serves a foreign athlete's program at 200).
   404 not 403 — a spurious 403 signs the athlete out.
2. **Param guard emits 403 to MATCH legacy** (not the shim's natural 400): a deliberate
   fidelity choice so the golden's malformed/missing-param probes stay green. Unreachable via
   the app. (This is the one place the shim intentionally reproduces the legacy 403 for a
   non-auth reason — because legacy's `/error` swallow does too.)

## Scope fence

- Serve ONLY `GET /api/v1/program`. **Do NOT serve** the iOS admin AUTHORING endpoints
  (`POST`/`PUT`/`DELETE` `/generalProgram`, `/individualProgram`, `/program`) — owner-confirmed
  read-only: the coach authors on the WEB platform (D-4, charter "web = coach's tool"), so the
  in-app CreateProgram/authoring surface is superseded, exactly as P1.2 declined the admin-only
  user endpoints. An ADMIN opening the app keeps the athlete read; the in-app authoring screens
  are out of contract.
- NO users import (P2.1 — the prod identity table stays empty; the golden seeds its own).
  NO DNS/Vercel/cutover work. NO legacy backend or iOS changes. NO coach-side publish UI
  changes beyond the `recordPublishedDay` content write. No UI work.
- Do not modify `initiatives/**` (this file included), `CLAUDE.md`, CI configs, or lockfiles.

## Wire traps (sacred — charter)

Raw `Authorization` (single leading `Bearer`/`bearer` strip — P1.1) · HTTP **200-only**
success · `yyyy-MM-dd` dates · **NEVER `isRestDay:false` + `dailyProgram:null`** (the
`ProgramView.swift:53` fatalError — guarded by CHECK + serializer + test) · **403 ONLY for an
auth denial or a malformed request-binding** (it drives sign-out); a business outcome is 200 or
404, never 403 · integer legacy ids as JSON numbers · key order per the golden's canonical-JSON
compare.

## Acceptance gates (verify before opening the PR)

1. Golden green vs the live harness for the full `/program` matrix (+ the P1.1/P1.2 cases still
   green); a cold run is deterministically green (the AS-8 warmup already landed in P1.2).
2. Unit/integration: scope-to-self 404; channel routing (general vs individual by
   `legacyPlanId`); the tiebreak (latest `publishedAt` wins); the param-guard 403; the
   **fatalError invariant** (serializer throw + DB CHECK reject) pinned by explicit tests;
   `recordPublishedDay` content write; `links.ts` aggregates still correct.
3. `pnpm check-types`, `pnpm lint`, `pnpm dep:check` clean; touched vitest slices green. Full
   serial api-server suite NOT required.
4. Migration applied to dev Neon; `db:generate` clean; the CHECK present with the right columns.
5. PR file list: zero `initiatives/`/`CLAUDE.md`/`.github/`; lockfile untouched (no new dep).
6. **No browser gate** — the shim is server-only. Say so in the PR body. The body STILL carries
   an owner checklist as `- [ ]` checkboxes (PR-body law): re-run the golden; `curl` `GET /program`
   (general training, general rest, individual, no-day-404, malformed-date-403) against harness
   and shim side by side; confirm the prod `db-migrate` applies the additive migration + CHECK;
   no Vercel env change this step. No signatures/attribution.

## Resource budget (WSL — hard law)

Heavy commands (build, full-package vitest, coverage) inside
`systemd-run --user --scope -q -p MemoryMax=4G -p MemorySwapMax=1G -- <cmd>`; vitest
`--maxWorkers=2`; turbo `--concurrency=2`; heavy steps strictly sequential. The legacy harness
compose keeps its own limits. If `systemd-run --user` is unavailable, say so and fall back to
diet + sequencing.

## Process

- Branch `feat/apex-shim-program-serve` off `main`; PR against `main`.
- Conventional commits, all-lowercase subjects, body lines ≤150, footer lines ≤100 (a
  `word:`-prefixed bullet >100 chars parses as a footer token and is rejected). No signatures.
- No comments in code; delete comments in any code you touch. Dev DB only, never prod.
- End every turn declaring tree state (branch, clean/dirty, last commit).
- At the plan gate report, with a recommendation each (not option lists): the snapshot content
  column naming + the CHECK form; the read resolution query + the cross-link tiebreak; the
  program-outcome/renderer placement; the golden fixture-factory shape + how you align the
  snapshot `legacyRowId` to the legacy row's id; and any contract ambiguity surfaced in research.

## Carry-forward to raise at the plan gate (planner will promote to deferred)

Post-cutover the wire `id` (`legacyRowId`) is no longer supplied by a foreign backend — it must
be minted locally when the legacy push is removed (P4.1) / at cutover (P3.2). P1.3 relies on the
dual-write supplying it. Also: pre-P1.3 `MobilePublishedDay` rows carry null content, so days
published before this step need a content backfill (from the final legacy dump) at cutover
before they are servable. Both are cutover/P4 concerns, out of scope here — flag, don't fix.

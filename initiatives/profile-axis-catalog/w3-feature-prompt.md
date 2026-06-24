# W3-core — Athlete two-layer profile: the catalog-backed athletic-card picker + PAC-2 selections migration · `/feature` prompt

**For an EXECUTOR session.** Open → `/initiative-resume` (read charter / state / decisions **D-1 / D-2 / D-7 / D-8 / D-9** / deferred **PAC-2 / PAC-9 / PAC-12**) → then run `/feature` with the brief below. W3 is the LAST wave (`plan.md`). This is **W3-CORE**; **PAC-17** (inline-set gender from the session) is a SEPARATE fast-follow — see `w3-pac17-feature-prompt.md`, **do NOT build it here**. Owner-smoke on the platform app after. ≤1 `/feature` is your budget.

## Lens (carry into every UX call)

- **Athlete-POV, first person** — the athlete speaks as himself ("I proactively set my Level to RX from my profile"), NOT as Denys's proxy (`athlete-pov-firsthand`).
- **Athlete-facing UX → design on MOCKS first, owner-approve the UX BEFORE wiring** (`ui-first-for-training-domain`).
- **EXTEND the shipped athlete profile screen, do NOT rebuild it** (`athlete-core` D-PROF-_ / D-FIELDS-_).

## What W3-core builds — and ONLY this

Three coupled pieces, one vertical slice (DB read → athlete UI → data-migration). The catalog already exists (W1/W2 live on prod); W3 makes the athlete CONSUME it.

### 1. An athlete-gated catalog READ (net-new plumbing — the gap the prior waves left)

The athletic-card picker needs the catalog's pickable axes, but the existing `GET /api/platform/profile-axes` is **COACH-gated** (`withCoachAuth` at the route + `requireCoachLikeRole` inside `profileAxisPlatformApi.list` — it was built for the coach load-editor's find-or-create). The athlete profile screen runs under `withAthleteAuth` → it would **403**. Add an athlete-readable catalog list:

- A dedicated **`GET /api/platform/athlete/profile-axes`** route — `withAthleteAuth` + `withAuthRateLimit` (mirror `apps/platform/src/app/api/platform/athlete/profile/route.ts`'s wrappers exactly).
- A new `profileAxisPlatformApi` method (e.g. `listForAthlete`) that returns ONLY `binding === null` axes (**server-side filter** — gender hidden at the source, not just in the UI), ordered `label asc`, **WITHOUT** the `requireCoachLikeRole` gate (the route's `withAthleteAuth` IS the gate; the catalog is non-sensitive — axis labels + values). Reuse the existing `mapToProfileAxis` mapper + the `ProfileAxis` contract / `getProfileAxesResponseSchema` response shape.
- A TanStack query hook mirroring `apps/platform/src/lib/hooks/use-profile-axes.ts`, athlete-query-keyed, + an api-client method mirroring `apps/platform/src/lib/api/endpoints/profile-axes.ts`.
- **Chosen over** broadening the coach endpoint's guard (that would relax BOTH the route guard AND the in-method `requireCoachLikeRole`, touching the coach api + the coach create path) — a focused athlete read is boundary-cleaner and enforces "hide bound" server-side. (D9-2.)

### 2. The athletic-card curated picker (EXTEND `ProfilePicksCard`)

`apps/platform/src/modules/athlete-profile/components/profile-picks-card.tsx` today is a read-only honest-display: `Object.entries(profileSelections)`, one row per pick, **printing the key raw** — post-W2 the key is an `axisId` cuid, so it renders a bare `cmqr…` (this is **PAC-12**). Extend it into the catalog-backed curated picker:

- **Re-label** — resolve each saved pick's `axisId` → the catalog `label` (from piece 1's read). Closes PAC-12's render half.
- **Proactive curated picker** — render every `binding=null` catalog axis with its `values` as a pick-group, so the athlete sets each classification AHEAD of any load (the charter's "proactively sets his training classification"). Highlight his current pick; let him set / change / clear it. **This is the curated picker `D-PROF-SELECTIONS-HONEST` had to CUT "for lack of a catalog" — the catalog (W1/W2) now fulfills that named condition (D-9).** The axes + values are REAL catalog rows, never invented (the honest-data principle HOLDS).
- **Write** — a pick writes `profileSelections[axisId]` via the EXISTING `useUpdateAthleteProfile` PUT: merge the one key into the map (like `apps/platform/src/modules/athlete-session/utils/use-session-logging.ts`'s `pickProfile`), clear-last → `{}` never `null` (D-PROF-SELECTIONS-HONEST; the update schema rejects null). **NO new write backend.**
- **Hide bound axes** — `binding != null` (gender) axes NEVER render here; gender lives in `AthleteDetailsCard` (D-1, no dup render). Mirror `inline-profile-picker.tsx`'s `binding === null` filter (defensively in the UI too, even though piece 1 already server-filters).
- **Tolerate orphans** — a saved pick whose `axisId` is absent from the catalog (a deleted axis — PAC-9) must degrade gracefully (skip or a label-less fallback), never crash.
- Reuse the existing card / chip / button primitives + house rules: **floating labels everywhere**, colors via `palette.*` (no hex), no px layout sizing, one-component-per-file, MUI per-icon imports (Turbopack).

### 3. PAC-2 — the bulk `profileSelections` key migration (PROD DATA → D-8 discipline)

Legacy `profileSelections` keys are free-string axis NAMES; the resolver + the W2 inline-picker read/write by `axisId`. Re-home the keys. **This is a PROD data-migration → D-8 / `prod-data-inviolable`: probe prod → idempotent backfill → DRY-RUN vs a prod snapshot → gated cutover. NO "merge then fix" (the #309 lesson).** Full backfill map: `deferred.md` PAC-2. Template: `packages/api-server/scripts/backfill-byprofile-reapply.ts` (lift its `auditProfileSelections` pre-flight).

- **Target** — `AthleteProfile.profileSelections` (Json on `app_athlete_profiles`).
- **Per key:** cuid → SKIP (idempotent) · gender-token {gender, sex, …} → **DROP** (dead — gender lives in the typed column, D-1; **guard:** only drop when the typed `gender` is set, else FLAG in the dry-run, no silent data loss) · else (a training-axis name) → find-or-create a catalog axis by name → re-key `{axisId: value}`.
- **Properties** — idempotent · dry-run by default · `--write` backs up + one transaction + post-write re-validation · tolerate-orphan.
- **Prod today** (journal 2026-06-24): 1 athlete, gender-keyed only → 0 inert-risk → the migration just drops one dead key. Near-empty — author it with the FULL D-8 discipline anyway (this is the exact "near-empty bet" that caused #309).

## Read first (verbatim — don't re-derive)

- **This initiative:** `charter.md` (W3 + the Sacred list) · `plan.md` (the W3 row + "Deferred to W3") · `decisions.md` **D-9** (this wave's shape), **D-1** (two-category ontology), **D-2** (catalog unlocks the picker), **D-7** (the `binding` shape — context, don't touch), **D-8** (the prod-migration law) · `deferred.md` **PAC-2** (the backfill map), **PAC-9** (tolerate-orphan), **PAC-12** (the render debt this closes).
- **athlete-core decisions** (`initiatives/athlete-core/decisions.md`) — **D-PROF-SELECTIONS-HONEST** (why the picker was cut + the clear-last-→-`{}` rule), **D-PROFILE-SELECTIONS** (the free-string seam PAC-2 closes), **D-FIELDS-GENDER-INERT** (gender stays typed, not an axis), **D-PROF-FIELDS** + **D-FIELDS-DETAILS-CARD** (the shipped screen's card layout — what you EXTEND).
- **The profile screen (EXTEND target):** `apps/platform/src/app/athlete/(secondary)/profile/page.tsx` · `apps/platform/src/modules/athlete-profile/views/athlete-profile-view.tsx` · `components/profile-picks-card.tsx` (+ `profile-pick-row.tsx`) · `components/athlete-details-card.tsx` (**gender lives here — do NOT duplicate it onto the athletic card**) · the profile hooks `apps/platform/src/lib/hooks/use-athlete-profile.ts` (`useAthleteProfile` / `useUpdateAthleteProfile`).
- **The catalog read (mirror + relax for athlete):** `apps/platform/src/app/api/platform/profile-axes/route.ts` · `packages/api-server/src/endpoints/coaching/profile-axis.ts` (`profileAxisPlatformApi`) · `apps/platform/src/lib/hooks/use-profile-axes.ts` · `apps/platform/src/lib/api/endpoints/profile-axes.ts` · `packages/contracts/src/entities/coaching/profile-axis/*` · `apps/platform/src/app/api/platform/athlete/profile/route.ts` (the `withAthleteAuth` wrapper to mirror).
- **The write (reuse):** `packages/api-server/src/endpoints/coaching/athlete-profile.ts` (`upsert` handles `profileSelections`) · `packages/contracts/src/entities/coaching/athlete-profile/athlete-profile.schema.ts` (the update schema — `profileSelections` is `z.record(string,string).optional()`).
- **The migration template:** `packages/api-server/scripts/backfill-byprofile-reapply.ts`.
- **READ-ONLY context (DO NOT TOUCH):** `packages/contracts/src/entities/lms/_shared/load.ts` (the sacred VO) · `packages/api-server/src/endpoints/lms/athlete-records/resolve-load.ts` + `load-records.ts` (the resolver) · `apps/platform/src/modules/athlete-session/components/inline-profile-picker.tsx` (the `binding===null` filter to MIRROR, not edit).

## Guardrails (HARD — W3-core stays inside these)

- **DO NOT touch the sacred byProfile VO** (`load.ts`). W3 = read + write-back + the selections migration, **NOT a VO change** (gate-light — that's why W3 needs no plan-editor-compose re-sign-off). `git diff` must show ZERO change to `load.ts`.
- **The lms RESOLVER must NOT read `ProfileAxis`** (`api-server-lms-no-coaching` — pre-push `dep:check` fails the push otherwise). The athlete catalog read lives ONLY in the athlete-profile screen's data layer (platform→`@repo/api-server/coaching` is an allowed edge). **DO NOT add any catalog read into `resolve-load.ts` / `load-records.ts`.** `git diff` must show ZERO change to the resolver.
- **gender stays a TYPED column** (D-1). The athletic card must NOT render / duplicate it (filter `binding === null`). gender is editable ONLY in `AthleteDetailsCard`.
- **EXTEND `ProfilePicksCard` + the shipped screen, don't rebuild** (athlete-core D-PROF-_ / D-FIELDS-_). Keep the identity / body-stats / details cards as-is.
- **DO NOT broaden the COACH `profile-axes` endpoint's auth** — leave `withCoachAuth` + `requireCoachLikeRole` on the coach list/create. Add a SEPARATE athlete read.
- **PAC-2 = `prod-data-inviolable` / D-8.** Do NOT connect to prod from the build; AUTHOR the script + dry-run; the prod-snapshot DRY-RUN + cutover are an OWNER-gated step BEFORE merge. NO "merge then fix."
- **Confirm W3-core needs NO Prisma migration** — the catalog model already has `binding`; the athlete read + the picker + the script add no column. If you think you need one, STOP and surface it (don't author migrations / touch CI / lockfiles / `.gitignore` without confirmation — `CLAUDE.md`).
- **Tests:** the `@repo/api-server` suite is GATED (~10 min serial, live Neon — `api-server-serial-tests`). Write the athlete-read endpoint + PAC-2 tests, but run the api-server suite ONLY on owner ok. `check-types` + `lint` + platform / contracts unit tests are fine unprompted.

## Acceptance (properties, not tasks)

- An athlete opens his profile → the athletic card shows EVERY `binding=null` catalog axis with its values; his current picks are highlighted + **re-labeled by the catalog `label`** (never a raw cuid).
- He sets / changes a pick → it writes `profileSelections[axisId]`; reload persists; a session byProfile load on that axis then resolves **without** the inline picker.
- The gender axis (`binding=GENDER`) does NOT appear on the athletic card; gender stays editable only in the details card (no dup render).
- A pick whose axis was deleted (orphan) degrades gracefully (no crash).
- `GET /api/platform/athlete/profile-axes` returns `binding=null` axes for an athlete (no 403); the COACH endpoint's auth is untouched (`git diff`).
- PAC-2 backfill: idempotent, dry-runs clean against a prod snapshot, drops dead gender-keys (typed-gender-set guard) + re-homes name-keys → axisId.
- `check-types` + `lint` green; `git diff` confirms ZERO change to `load.ts` / `resolve-load.ts` / `load-records.ts` and to the coach `profile-axes` auth.
- The athletic-card UX was approved on MOCKS first (athlete-POV) before wiring.

## Process (mock-first — non-negotiable for the athlete-facing UX)

1. **Mock the athletic-card UX first** (athlete-POV, first-person), owner-approve it — BEFORE any wiring.
2. Then wire: the athlete catalog read (piece 1) → the picker + re-label + write-back (piece 2).
3. Author the PAC-2 script + its dry-run (piece 3); the prod-snapshot DRY-RUN + cutover are OWNER-gated (D-8), AFTER the UI is owner-accepted.

## Owner smoke (after the run, on dev)

`db:reset` → admin (:3002) → Profile Axes → create `level` (RX/SC) + a second axis → platform (:3001) as an athlete → Profile → the athletic card shows Level with RX/SC + the second axis; pick RX → persists across reload; gender still ONLY in the details card (not on the athletic card). Open a session with a byProfile load on `level` → it resolves from the pick, no inline picker. Then the PAC-2 dry-run vs a prod snapshot (owner-gated) → review the audit → cutover. That closes W3-core. **PAC-17** (inline-set gender from the session) is the NEXT executor session — `w3-pac17-feature-prompt.md`.

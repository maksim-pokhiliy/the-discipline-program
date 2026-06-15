# P — Coach Profile UI — `/feature` runner prompt

> Self-contained prompt for a fresh `/feature` runner (you have none of this context). Initiative: **coach-station** (Phase 2), wave **P** (board step #2). Runs in an **ISOLATED git worktree**, branch off `main`, **in parallel with the R1b session** — touch ONLY the files this wave owns (coach-profile slice); never edit plan-detail / clone code (R1b's territory). Full `/feature` (one per session). **UI-heavy → the owner browser walkthrough is the real acceptance gate** (jsdom is blind to upload / sheet / inline-edit / pointer layers).

## Mission

`/coach/profile` in `apps/platform` is a stub today (`<PageHeader title="Profile" />`). Build the real screen: a coach edits his identity (avatar · name · role · location · "coaching since" · bio · specialties), sees an **honest** derived track-record, manages a structured **credentials** list, and sets his **workspace timezone**. **The backend for everything beyond `bio` does NOT exist yet** — you build the full vertical slice (Prisma → contracts → api-server → routes → client → hooks → UI), mirroring the existing sibling patterns verbatim.

## Load context first

1. **`/initiative-resume`** — raise the coach-station board (charter → state → decisions D-1..D-6 → deferred). Read `decisions.md` and `charter.md`.
2. **D-5 is AMENDED (owner-ratified 2026-06-15).** The original D-5 PROFILE-SCOPE said _"the `CoachProfile` Prisma schema is **NOT expanded**"_. The owner has **overridden** that for this wave: the schema **IS** expanded — a new `CoachCredential` entity + `CoachProfile.location` + `CoachProfile.specialties`. Everything else in D-5 still holds (profile is off-spine; user-meta is editable). **At close-out, record this as `D-7 PROFILE-SCHEMA-EXTENDED` in `decisions.md`** (supersedes D-5's no-expand clause; cite owner approval + the prototype's first-class credentials) and amend the charter non-goal. **Close-out docs land IN this feature PR**, not a later commit.
3. **Design intent (the prototype).** The hi-fi prototype is _Coach Profile — Option B "Athlete's eye"_: a single-scroll, mobile-first PWA page. The **5 sections you build are described in Scope below** — you do NOT need the prototype file to build them. The owner holds the visual prototype link if you need pixel fidelity; **design the UI through the `ui-ux-pro-max` plugin** (initiative rule), consuming the existing platform theme + `@repo/ui` primitives. The design system is dark-only, Barlow, 4px radius, no shadows, palette-only color — it is already the live `@repo/mui` theme; do not invent tokens.

## Scope — 5 sections, ONE `/feature`

| #   | Section (coach-facing) | What it shows / does                                                                                                                         | Backend it needs                                                                               |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | **Identity hero**      | Avatar (upload) · name (edit) · role badge (RO) · location (edit) · "Coaching here since {Mon YYYY}" · bio (edit) · specialties chips (edit) | user-meta write (name/image/timezone) + `CoachProfile.location`/`specialties` + existing `bio` |
| 2   | **Your track record**  | Pulse-band of **3 honest derived** numerals + a `DERIVED` pill                                                                               | new aggregation in the profile page-data endpoint                                              |
| 3   | **Credentials**        | List of `{title · issuer · year}` rows, each with a **shown-to-athletes** toggle + delete; "Add credential" sheet                            | **new `CoachCredential` entity** + CRUD routes                                                 |
| 4   | **Workspace**          | Timezone (device-detect default + searchable override) · account email (read-only, "contact support to change")                              | user-meta write (timezone)                                                                     |
| —   | **Cross-cutting**      | Avatar upload (platform has **none** today — see RE-VERIFY) + the profile page-data GET + the two-table profile PUT                          | upload route+client+hook; page-data + update endpoints                                         |

**Track-record = exactly these 3 honest metrics** (every one is exactly computable from live data today):

- **Months active** — from `User.createdAt` (whole months since).
- **Athletes coached** — `prisma.coachAthleteAssignment.count({ where: { coachId } })` where `coachId` = this coach's `CoachProfile.id`.
- **Plans authored** — `prisma.trainingPlan.count({ where: { creatorId: userId, deletedAt: null } })`.

**OUT — do NOT build (any of these expands the wave or builds a façade over absent infra):**

- **Integrations** (Telegram / Instagram / Google Calendar) — Telegram is **explicitly OUT of MVP** (`docs/roadmap.md` §"Explicitly OUT of the MVP"); IG/GCal each need an external OAuth provider; provider wiring is Phase 5. The prototype's integrations are a pure mock. **Cut entirely.**
- **"Sessions delivered" stat** — it derives from `PerformedSession`, a **known-wrong Phase-3 stub** (`docs/roadmap.md` §"Where we are now": _"redesigned in Phase 3"_). It would lie. Omit; it returns in Phase 3.
- **Notifications matrix** (needs email [Phase 4] + Telegram delivery), **change-password**, **data export** (GDPR, Phase 6), **language switch** (no i18n infra), **"View as athlete" / athlete-preview sheet**, and any **athlete-facing public coach page**. All out.
- **Credential reorder** (the final prototype doesn't reorder; order by `createdAt asc`).
- The **R1a/R1b clone code** and the **frozen session primitive** (Sacred — see Red lines).

## Domain model — verbatim current state + the additive changes

**Current (`packages/api-server/prisma/schema.prisma`) — do not restate, EXTEND:**

```prisma
model User {
  id String @id @default(cuid())
  email String @unique
  name String?
  image String?
  role Role @default(ATHLETE)
  timezone String @default("UTC")
  createdAt DateTime @default(now())
  // … coachProfile CoachProfile?  athleteAssignments / trainingPlansCreated relations exist …
}

model CoachProfile {
  id String @id @default(cuid())
  userId String @unique
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  bio String?
  coachAthleteAssignments CoachAthleteAssignment[]   // ← count source for "Athletes coached"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  @@index([createdAt]) @@index([deletedAt]) @@map("app_coach_profiles")
}
```

**Additive changes (all non-prod, applied via `db:reset` — no migration files; this repo has none — per ADR-0019 / memory):**

```prisma
model CoachProfile {
  // … existing fields unchanged …
  location    String?
  specialties String[]            @default([])
  credentials CoachCredential[]
}

model CoachCredential {
  id              String       @id @default(cuid())
  coachProfileId  String
  coachProfile    CoachProfile @relation(fields: [coachProfileId], references: [id], onDelete: Cascade)
  title           String
  issuer          String
  year            Int
  shownToAthletes Boolean      @default(true)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([coachProfileId])
  @@map("app_coach_credentials")
}
```

- `shownToAthletes` is **forward-looking**: it's stored, but there is **no athlete-facing consumer yet** (the public coach page is out). Persist it; don't build a reader.
- After editing the schema: run `pnpm db:generate` (regenerates the client TYPES, no DB needed) so `check-types` sees `CoachCredential`. The actual DB apply is `pnpm db:reset` — **gated, owner-run** (it reseeds; never run the api-server suite or `db:reset` without owner approval — see Acceptance).

**Constants to add** (mirror `coach-profile.constants.ts` style):

- `COACH_PROFILE_CONSTANTS`: keep `MAX_BIO_LENGTH: 2000`; add `MAX_LOCATION_LENGTH: 120`, `MAX_SPECIALTIES: 12`, and the preset list `SPECIALTY_PRESET = ["Olympic lifting","Powerlifting","Bodybuilding","CrossFit","Strongman","GPP","Hypertrophy","Return-to-train","Youth athletics","Masters","Endurance","Mobility"]` (from the prototype). Specialties are picked from the preset and stored as `string[]`; validate each ∈ preset, length ≤ `MAX_SPECIALTIES`.
- `COACH_CREDENTIAL_CONSTANTS`: `MAX_TITLE_LENGTH: 160`, `MAX_ISSUER_LENGTH: 160`, `MIN_YEAR: 1950`. Validate `year` ∈ `[MIN_YEAR, currentYear]` (compute the upper bound in the endpoint, not the static schema — keep the zod max dynamic or validate server-side).

## The vertical slice — mirror these EXACT siblings

**The closest sibling is athlete-profile** (a GET/PUT singleton over a profile). The coach-profile slice already mirrors it. Read both verbatim and follow the shape:

- **Contracts** (`packages/contracts/src/entities/coaching/{athlete-profile,coach-profile}/`): `*.schema.ts` (entity + update zod), `*-api.schema.ts` (request/response aliases), `*.types.ts`, `*-api.types.ts`, `*.constants.ts`, `index.ts` barrel. **Register the new `coach-credential` subpath in `packages/contracts/package.json` `exports`** (alongside `"./coaching/coach-profile"`), and extend the coach-profile contract with the page-data + track-record + update shapes (see API design below).
- **api-server endpoint** (`packages/api-server/src/endpoints/coaching/{athlete-profile,coach-profile}.ts`): the `get` uses `findOrThrow(prisma.X.findUnique(...))`; `upsert` builds a spread-guarded `prismaData` and `prisma.X.upsert({ where, create, update })`, wrapped in `try/catch → handlePrismaError`. The mapper lives in `mappers/coaching/*.mapper.ts` and is re-exported from `mappers/coaching/index.ts`.
- **Aggregation reference** (`packages/api-server/src/endpoints/coaching/coach-dashboard.ts`): `Promise.all([...])` of `prisma.*.count(...)` / `findMany(...)`; resolves the coach via its `CoachProfile`. Copy this idiom for the track-record numbers. Note it reads `coachId` from the coach's profile — reuse that resolution.
- **User-meta two-table write reference** (`packages/api-server/src/endpoints/iam/users-admin-update.ts`): `buildUpdatePayload` spread-guards `name`/`timezone`; the write is a `prisma.$transaction`. For coach self-edit you write **User** `{name?, image?, timezone?}` **and** `CoachProfile` `{bio?, location?, specialties?}` in **one `$transaction`**. Do **NOT** touch `role`, `email`, `tokenVersion`, or `coachIds` (coach can't change his own role/email here). Reuse `updateUserSchema`'s field rules (`name` min1/max120/nullable; `timezone: timezoneSchema`; `image: imageUrlSchema`) — import the existing schemas (`@repo/contracts/iam/user`, `@repo/contracts/common`), don't redefine.
- **Route handlers** (`apps/platform/src/app/api/platform/{athlete,coach}/profile/route.ts`): `withCoachAuth(withAuthRateLimit(createAuthGetHandler|createAuthPutHandler(...), RATE_LIMIT_TIER.API))`. For credentials CRUD use `createAuthPostHandler`, `createAuthPutByParamHandler`, `createAuthDeleteHandler` (all in `@repo/api-routes`; signatures confirmed). `withCoachAuth` allows COACH/HEAD_COACH/ADMIN.
- **Client + hooks** (`apps/platform/src/lib/`): `api/endpoints/<entity>.ts` (a `create<Entity>API(client)` returning `client.request(...)` methods) → registered in `api/endpoints/index.ts` + `api/index.ts`; `api/keys.ts` (`createEntityKeys(ROOT, "...")` or a hand-rolled key group); `hooks/use-*.ts`. The CRUD-hooks factory is `createCrudHooks` (`@repo/query`) — see `hooks/use-training-plans.ts` for the canonical wiring + `useOptimisticMutation` for updates. **Profile is a singleton** (no `byId`) → use a plain page-data query hook + a `useUpdateCoachProfile` optimistic mutation; **credentials are a sub-collection** → list comes inside the profile page-data; create/update/delete are their own mutations that invalidate `coachProfile.data()`.

### API design (resolve these exactly — don't improvise the shape)

- **`GET /api/platform/coach/profile`** returns a single **`CoachProfilePageData`**:
  ```
  {
    user:       { name, email, image, role, timezone, createdAt },
    profile:    { bio, location, specialties },
    credentials: CoachCredential[],            // ordered by createdAt asc
    trackRecord: { monthsActive, athletesCoached, plansAuthored }
  }
  ```
  One GET, one round-trip (read-surface: never N calls). Replaces the current bio-only GET. Build it on the existing `coachingCoachProfileApi.get` (extend it / add `getPageData`) so the route stays `withCoachAuth`.
- **`PUT /api/platform/coach/profile`** accepts `{ name?, image?, timezone?, bio?, location?, specialties? }`, writes User-meta + CoachProfile in one transaction (upsert the CoachProfile if missing, mirroring today's `upsert`), returns the updated `CoachProfilePageData` (or at least the updated profile+user slice — pick one and keep the client cache coherent).
- **Credentials** under `/api/platform/coach/credentials`:
  - `POST` → `{ title, issuer, year, shownToAthletes }` → created `CoachCredential`.
  - `PUT /[credentialId]` → partial update (incl. toggling `shownToAthletes`).
  - `DELETE /[credentialId]` → 204.
  - **Ownership:** every credential mutation must verify the credential's `coachProfile.userId === userId` (a `verifyCredentialOwnership` helper, like the `verify*Ownership` pattern in lms). Never trust the path id alone.
- **Avatar upload** — see RE-VERIFY; the flow is `ImageUpload → useUploadImage({ file, context: "avatar" }) → { url } → PUT profile { image: url }`.

## ⚠️ RE-VERIFY FIRST — the research stage's #1 job (don't trust this prompt's paths blindly)

These were NOT all read verbatim while writing this prompt — confirm each against **current `main`** before specing:

1. **Barrels / registration you must read + extend (quote current state, then add):**
   - `packages/contracts/package.json` → `exports` (add `"./coaching/coach-credential"`).
   - `packages/api-server/src/endpoints/coaching/index.ts` (the `@repo/api-server/coaching` barrel — **read it**; export the new credential api + any new profile api).
   - `packages/api-server/src/mappers/coaching/index.ts` (add the credential mapper).
   - `apps/platform/src/lib/api/index.ts`, `api/endpoints/index.ts`, `api/keys.ts`, `lib/hooks/index.ts` (read each; register the new endpoints/keys/hooks).
2. **Avatar upload is ABSENT on platform.** Confirmed: `apps/platform/src/app/api/**` has **no** upload/storage route; there is **no** `useUploadImage` on platform. The reference is **admin**: `apps/admin/src/lib/hooks/use-upload.ts` (`useUploadImage`/`useDeleteImage`), its `api.upload.uploadImage(file, context)` client, the upload route under admin, and `UPLOAD_CONFIG.avatar` (`@repo/contracts/storage/upload` — context `"avatar"`, prefix `avatars`, max 2 MB, jpeg/png/webp/gif). **Decide + build (IN scope):** either extract the upload hook+client into a shared package and consume from both apps, **or** add a platform-local upload route (`withCoachAuth`) + client + hook mirroring admin. The Vercel Blob adapter (`packages/api-server/src/infrastructure/storage/vercel-blob-adapter.ts`, ADR-0013) already exists — reuse it; do not add a new storage mechanism.
3. **The page + nav** — confirm `apps/platform/src/app/coach/profile/page.tsx` is still the stub and `lib/config/navigation.ts` still has the `/coach/profile` "Profile" tab. Confirm `PlatformLayout` is the page shell.
4. **UI primitives (confirm props before use):** `PulseStatsCard`/`PulseStat` (`@repo/ui` — the 3-cell band, `{ value, label, tooltip, color }`), `FormModal` (`@repo/ui` modal — `onSubmit`/`isSubmitting`/`submitText`/`submitDisabled`), `InlineEditText` (`@repo/ui` — `value`/`onCommit`/`variant`/`ariaLabel`/`multiline`/`maxLength`), `ImageUpload` (`@repo/ui`), `TimezoneAutocomplete` pattern (admin `users/components/timezone-autocomplete.tsx` — `Intl.supportedValuesOf("timeZone")`; reuse/adapt into a platform sheet), `UserChip`/MUI `Avatar` for the avatar with initials fallback. **Specialties picker:** preset multi-select rendering removable chips — reuse `MultiSelect` or a chip-toggle from `@repo/ui` (design via `ui-ux-pro-max`); do NOT use `LabelPickerChip` (it's bound to the `Label` domain entity, not free strings).

## Phases (commit units)

1. **Prisma + contracts** — schema additions (`CoachCredential` + `CoachProfile.location/specialties`); new `coach-credential` contract entity (schema/api/types/constants/index) + `package.json` exports; extend the `coach-profile` contract with `location`/`specialties` on the entity+update schema, plus the new `CoachProfilePageData`, `trackRecord`, and the extended update request/response shapes. `pnpm db:generate`. `check-types` green.
2. **api-server** — `coachingCoachCredentialApi` (list-not-needed [comes via page-data], create/update/delete + `verifyCredentialOwnership`) + mapper; extend `coachingCoachProfileApi` with `getPageData` (user + profile + credentials + track-record aggregation) and the two-table `update`; register barrels. Unit tests for the mapper, the derived math, the two-table update, and credential ownership (these run in the **gated** api-server suite).
3. **Platform routes + client** — routes: `GET`/`PUT` `/coach/profile` (page-data + update), credentials `POST` + `[credentialId]` `PUT`/`DELETE`; the avatar upload route+client+hook (per RE-VERIFY #2); client endpoint files; `keys.ts`; query hooks (page-data query + profile optimistic update + credential mutations invalidating `coachProfile.data()`).
4. **UI (design via `ui-ux-pro-max`)** — rebuild `coach/profile/page.tsx` as a client page over the page-data hook: **hero** (`ImageUpload` avatar + `InlineEditText` name & bio + role badge + location field + "since" + specialties picker), **track-record** (`PulseStatsCard`, 3 cells + `DERIVED` pill), **credentials** (rows + shown toggle + delete + "Add credential" `FormModal`), **workspace** (timezone picker sheet with device-detect default + email read-only). House rules throughout. jsdom tests for hook wiring + mutation payloads + request shapes.
5. **Tests + close-out + walkthrough** — finalize unit/jsdom; write the close-out docs (D-7 in `decisions.md`, board/journal/plan update, charter non-goal amend) **in this PR**; hand the owner the walkthrough + gated-suite ritual.

## Red lines

- **Reuse patterns verbatim** — the athlete/coach-profile slice, `createCrudHooks`/`useOptimisticMutation`, the auth wrappers + handler factories, the admin two-table update idiom, the Vercel Blob adapter, the `@repo/ui` primitives above. Don't reinvent; don't fork the frozen primitive.
- **Sacred (do not touch):** the frozen session primitive + `primitive-spec.md`; the **plan-detail components and the R1a/R1b clone slice** (the parallel R1b session owns them — file-level no-go); `initiatives/ACTIVE` (already `coach-station` in main).
- **House rules:** no hex outside the theme palette (palette slots only); **one component per file**; **MUI floating labels** everywhere (`label` prop, never a caption `Typography` above a field); user displays render `UserChip`/`Avatar` with initials fallback; **no silent list caps — honest counts** (credentials list returns all; track-record numbers are real, never padded).
- **Out-list is binding:** no integrations, notifications, change-password, export, language switch, athlete-preview, athlete-facing page, "Sessions delivered", credential reorder. If a section feels thin without them, that's correct for MVP — don't backfill.
- **`role` + `email` are read-only** in this UI (role is a display badge; email shows "contact support to change"). The coach edits only name/image/timezone/bio/location/specialties/credentials.
- **`shownToAthletes`** is stored only — build no athlete-facing reader.
- **D-5 amendment** must be recorded as **D-7** at close-out (this is a ratified schema expansion, not a silent drift). **Close-out docs in THIS PR.**
- **Worktree discipline:** branch off `main`; stay in the worktree; this wave's files only.

## Acceptance

- `pnpm check-types` / `pnpm lint` / `pnpm dep:check` green.
- **Unit + jsdom** green: contract zod round-trips; the track-record derivation; the two-table profile update; credential CRUD + ownership; client hook wiring + mutation payloads + request shapes.
- **Gated api-server suite = OWNER verify ritual** (do NOT run it yourself — it's ~10 min serial on live Neon and needs approval): `pnpm db:reset && pnpm --filter @repo/api-server test`. Your new coach-credential + extended coach-profile suites must be part of it.
- **OWNER BROWSER WALKTHROUGH — the real gate** (jsdom is blind to upload/sheet/inline-edit): open `/coach/profile` → edit name inline → persists on reload; edit bio inline → persists; upload an avatar → shows + persists; set/clear location; pick & remove specialties; **track-record shows three honest numbers** (months active, athletes coached, plans authored) with the DERIVED pill; add a credential via the sheet → appears in the list; toggle its shown flag; edit it; delete it → gone on reload; open the timezone picker → device tz pre-detected → override → persists; email shows read-only. Everything round-trips against the DB.

## After P

Board → **P done**. The coach station's identity surface is complete. Remaining coach-station waves (own `/feature` each): **G** DnD group-creation (deferred → DND-GROUP-CREATE) · **A-known** authoring polish (LABEL-FLOW-UX + QA-007) · decide **R2** templates slot (D-2, parked). Integrations / notifications / change-password / export remain **post-MVP** (revisit when provider wiring + email lifecycle land — Phase 5 / Phase 4).

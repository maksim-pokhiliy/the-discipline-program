# Step 1.4 — Appetize stand (apex-sunset P1.4)

Invoke the `/feature` skill with the MONOREPO half below as its argument (calibre:
**small**) and run its pipeline: research → plan (STOP at the plan gate and report to the
PLANNER session that spawned you — not the repo owner) → implement → internal review →
PR. The FORK half runs OUTSIDE /feature (a foreign repo with none of our pipeline) —
execute it as described, iterating on live GitHub Actions runs. This file is skill INPUT,
not a plan override; where it pins a live-verified fact, trust it over guessing, and
verify anchors against the trees.

## Mission

Stand up the D-5 layer-2 e2e bench: the REAL iOS app, built signing-free for the
simulator with its base URL patched to the platform shim, streamed in the owner's
browser via Appetize.io. The owner then drives login → day → profile against the LIVE
prod shim — the first human end-to-end pass over the whole compat vertical.

Two halves:

1. **Monorepo:** `shim-demo-seed` — an idempotent script that builds a fully synthetic
   demo universe (coach → connection → plan → INDIVIDUAL link → athlete + identity →
   published days with content) so the demo athlete can sign in and SEE a program.
   Verified against dev Neon by you; the prod run is the PLANNER's (owner pre-approved).
2. **Fork:** `.github/workflows/appetize-stand.yml` in `maksim-pokhiliy/the-discipline-program-ios`
   — simulator build with the base URL patched at BUILD TIME (never committed), zipped
   and uploaded to Appetize via its REST API. Iterated on live Actions runs until green.

## Live-verified facts (recon 2026-08-14 — AUTHORITATIVE)

- **Fork exists and is ready:** `maksim-pokhiliy/the-discipline-program-ios` (public,
  default branch `develop`, parent `vladyslav-pustovalov/the-discipline-program-ios`).
  Actions ENABLED; secret **`APPETIZE_API_TOKEN` already set** by the planner. The two
  inherited upstream workflows are dormant (one triggers only on push to `master`, one is
  manual) — do not touch them.
- **Local clones:** `~/projects/contrib/tdp/mobile-ios` is the READ-ONLY upstream canon —
  NEVER modify it. Clone the FORK fresh to `~/projects/contrib/tdp/mobile-ios-fork` and
  work there (branch `develop`, direct commits — it is a stand, not a product repo).
- **Project:** `TheDisciplineProgram.xcodeproj`, target `TheDisciplineProgram`, **no
  shared scheme** → build with `xcodebuild -target TheDisciplineProgram` (if `-target`
  proves unworkable, commit a shared `.xcscheme` to the fork — allowed). One SPM dep
  (public `KeychainAccess`) — resolves on the runner. No ATS overrides in Info.plist.
- **Deployment target iOS 18.0/18.5** → needs the iOS 18.5 SDK → **Xcode 16.4** →
  runner `macos-15`. Select Xcode explicitly (`sudo xcode-select -s
/Applications/Xcode_16.4.app` — verify what the image actually ships via
  `ls /Applications | grep -i xcode` in an early step and adapt).
- **URL composition** (`Constants.swift`): line 13 `static let baseURL =
"https://thedisciplineprogram.com"`; the app appends `/api` in RELEASE config
  (`/dev-api` in DEBUG) + `/v1`. Therefore: **patch ONLY the line-13 host** (sed, inside
  the runner, never committed) **and build `-configuration Release`** → the app calls
  `<host>/api/v1/*` exactly like the App Store binary.
- **Default target host: `https://platform.thedisciplineprogram.com` (PROD).** All
  `*.vercel.app` preview URLs are behind Vercel SSO (`all_except_custom_domains` —
  planner-verified via the deployment-protection API); the app cannot pass SSO, so the
  prod custom domain is the only reachable shim. The workflow takes `base_url` as a
  `workflow_dispatch` input with that default, so a future custom-domain preview can be
  targeted by re-running with a different input.
- **Appetize:** accepts ONLY simulator `.app` bundles, zipped (`zip -r App.zip App.app`);
  ARM simulator builds recommended (the arm64 runner's native slice is right). REST API
  auth = `X-API-KEY: <token>` header. Exact create/update endpoints: consult
  `https://docs.appetize.io/rest-api.md` and the app-management pages (append `.md` to
  doc URLs for markdown) during implementation — do not guess them. Keep ONE app slot:
  read the repo variable `APPETIZE_PUBLIC_KEY` — if set, UPDATE that app; if unset,
  CREATE, then persist the returned publicKey via `gh variable set APPETIZE_PUBLIC_KEY`
  so every later run updates the same slot.
- **Streaming minutes are scarce** (free-tier Appetize). Success for the automated half =
  the upload API returns 200 + a publicKey. Do NOT auto-drive/stream the app from CI or
  locally — streaming is the OWNER's gate.

## Half A — monorepo (`/feature small`)

### Deliverable 1: the demo-seed script

An idempotent TypeScript script (placement per your plan — the prisma owner is
`@repo/api-server`, so a script under that package invoked via
`pnpm --filter @repo/api-server exec tsx …` is the natural home; root `scripts/` holds
bash only today). It targets whatever `DATABASE_URL` is in the environment and builds:

- **demo coach:** `User` `demo-coach@thedisciplineprogram.com` (COACH) + `CoachProfile`.
  Fully synthetic — do NOT touch the owner's existing `dev-coach@…` account or ANY
  existing row (prod data is inviolable; this script only ADDS its own demo-keyed rows).
- **`MobileConnection`** on the demo coach profile (dummy `encryptedToken`, dummy legacy
  fields, far-future `expiresAt`) — required only because `MobilePublishLink.connectionId`
  is NOT NULL; no read path ever uses it.
- **`TrainingPlan`** created by the demo coach (name it so it is self-evidently the
  stand's, e.g. "Shim Stand Demo Plan").
- **`MobilePublishLink`** channel `INDIVIDUAL`, `legacyUserId: 990001`, `athleteId` = the
  demo athlete. INDIVIDUAL is load-bearing: the athlete's program rows are keyed to his
  own synthetic legacyUserId, so NO real athlete can ever be served demo content (a
  GENERAL link would leak demo days to every real athlete of that level post-P2.1).
- **demo athlete:** `User` `demo-athlete@thedisciplineprogram.com` (ATHLETE), password =
  bcrypt (cost 12, reuse the iam hashing util if cleanly importable, else bcryptjs) of
  the REQUIRED env var `SHIM_DEMO_ATHLETE_PASSWORD` — no default, never committed, never
  printed. Plus **`MobileLegacyIdentity`**: `legacyUserId 990001` (outside the legacy
  1..24 range → the P2.1 import can never collide), `legacyRoleId 1`, `legacyPlanId 2`
  (Individual — drives the channel routing), `legacyLevelId 2` (NOT NULL; unused for
  Individual routing), `isEnabled true`, `firstName "Demo"`, `lastName "Athlete"`,
  plausible `phoneNumber`/`dateOfBirth` so the profile screen looks populated.
- **`MobilePublishedDay` rows** for a rolling window: (run date − 3) … (run date + 60),
  alternating content, roughly every 4th day a REST day. Training days: a
  `LegacyDailyProgram`-shaped JSON (`{dayTrainings:[{trainingNumber, blocks:[{name,
exercises:[…]}]}]}`) whose text INCLUDES the day's date (so date navigation is visibly
  live in the app); 1–2 trainings, 2–3 blocks, realistic free-text exercises. Rest days:
  `isRestDay: true` + **`dailyProgram = Prisma.DbNull`** — SQL NULL, NEVER
  `Prisma.JsonNull` (the `rest_xor_program` CHECK rejects jsonb-null; this is the pinned
  P1.3 lesson — mirror `recordPublishedDay`). `legacyRowId`: synthetic unique ints
  (990100+n — these ARE the wire `id`s, fine). `contentHash`: the real `contentHash`
  util over the same hashable shape publish uses. `scheduledDate`: UTC-midnight
  `@db.Date` semantics (`new Date(\`\${yyyy-MM-dd}T00:00:00.000Z\`)`).
- **Idempotency:** every row upserted by its stable natural key (email / coachProfileId /
  plan identity / link uniques / `(linkId, scheduledDate)`); a re-run refreshes the
  window and never duplicates. **Never deletes anything.** Safety guard: if a
  `demo-*@thedisciplineprogram.com` User exists but was NOT created with the expected
  shape (e.g. it has a role you did not set), abort loudly rather than mutate.

### Deliverable 2: verification against dev Neon (yours; show outputs in the PR)

Run the script against dev Neon (`apps/platform/.env.local` `DATABASE_URL` — standing
approval). Then prove the vertical golden-style — invoke the ACTUAL route handlers
in-process (the golden's import pattern; no dev server):

- `POST /api/v1/auth/signin` (demo athlete creds) → 200, `userId: 990001` in the JwtDTO;
- `GET /api/v1/program?userId=990001&scheduledDate=<a training date>` → 200 individual
  shape (`{id, userId: 990001, scheduledDate, isRestDay: false, dailyProgram: {…}}`);
- same for a REST date → `isRestDay: true, dailyProgram: null`;
- `GET /api/v1/user/990001` → 200 profile with `firstName Demo`.

This is a run-once verification (a small runnable check script or documented invocation
— your call at the plan gate), NOT an extension of the golden suite: the golden pins the
shim-vs-legacy contract, and demo data has no legacy side. Do not touch the golden.

### Deliverable 3: `docs/runbooks/appetize-stand.md`

What the stand is (one paragraph + ADR-0043/D-5 pointers), the fork URL, how to trigger
the workflow (`gh workflow run appetize-stand.yml -R maksim-pokhiliy/the-discipline-program-ios
-f base_url=…` + the Actions UI path), where the secret/variable live, the seed script
recipe for dev AND prod (prod = pull `DATABASE_URL` transiently via
`npx vercel env pull` in `apps/platform`, run, delete — NEVER paste creds into files),
the demo athlete EMAIL + a note that the password is held by the owner/planner (repo is
PUBLIC — no secrets, no passwords, ever), and the Appetize minutes-budget note.

### Scope fence (monorepo)

- ONLY: the seed script (+ its small helpers/types), an optional package.json script
  entry, the runbook. NO changes to `api/v1` routes, the golden, `schema.prisma`,
  migrations, monorepo CI, or `initiatives/**` (this file included).
- `pnpm check-types`, `lint`, `dep:check` stay clean. Both repos are PUBLIC:
  grep-verify no secret/password/token string lands in any committed file.

## Half B — fork workflow (outside /feature; iterate on live Actions)

`.github/workflows/appetize-stand.yml` on the fork's `develop`:

- `workflow_dispatch` with input `base_url` (default `https://platform.thedisciplineprogram.com`).
- `runs-on: macos-15`; early step prints available Xcodes and selects 16.4 (adapt if the
  image differs — the RUN is your probe).
- sed-patch `Constants.swift` line 13 host → `${{ inputs.base_url }}` (verify the sed
  actually changed the line — fail the job if not, so a silent upstream drift of that
  line can never ship a stand pointing at legacy).
- `xcodebuild -project TheDisciplineProgram.xcodeproj -target TheDisciplineProgram
-sdk iphonesimulator -configuration Release CODE_SIGNING_ALLOWED=NO
CODE_SIGNING_REQUIRED=NO -derivedDataPath build` (adapt output paths as the run
  teaches; SPM resolves during the build).
- zip the produced `.app`; upload to Appetize (`X-API-KEY` from the secret; create-vs-
  update per the `APPETIZE_PUBLIC_KEY` repo variable as pinned above); **fail the job on
  a non-2xx upload** (parse the response, don't trust curl's exit code alone).
- Job summary prints: Xcode version used, the patched base_url, the Appetize publicKey +
  `https://appetize.io/app/<publicKey>`.
- Trigger runs with `gh workflow run … -R maksim-pokhiliy/the-discipline-program-ios`,
  watch with `gh run view/watch` — **read the step table, never trust a watch exit code**
  (banked lesson). Iterate until a fully green run with a confirmed upload. Then set
  `APPETIZE_PUBLIC_KEY` via `gh variable set` if this was the creating run.
- Fence: the fork gains EXACTLY ONE new file (plus, only if `-target` failed, a shared
  scheme). The Constants patch lives only inside runner steps. Do not modify the two
  inherited workflows. Conventional lowercase commits, no signatures.

## Acceptance gates (verify before reporting done)

1. Monorepo PR open: script + runbook; check-types/lint/dep:check clean; the dev-Neon
   seed run + all four route-handler verification outputs shown in the PR body.
2. Fork: one fully GREEN Actions run with the upload confirmed by the Appetize API
   response; `APPETIZE_PUBLIC_KEY` variable set; run URL + publicKey in your report.
3. Zero secrets/passwords/tokens in any committed file in EITHER repo (grep-verify;
   both repos are public).
4. The golden suite untouched and still green locally is NOT required this step (no
   monorepo runtime code changed) — but `endpoints-di-bootstrap.test.ts` must still pass
   if you touched `package.json` exports (you should not need to).
5. PR body carries the OWNER's browser-gate checklist as `- [ ]` checkboxes: open the
   Appetize app URL → tap through to login → sign in as `demo-athlete@thedisciplineprogram.com`
   (password: held by the owner) → today's TRAINING day renders with the date visible in
   an exercise line → navigate to a REST day → "Today is the rest day" → open profile →
   "Demo Athlete" fields render. Plus the post-merge planner items as unchecked context:
   planner runs the prod seed (owner pre-approved), curl-verifies prod signin/program/user,
   then the owner drives. No signatures/attribution anywhere.

## Resource budget (WSL — hard law)

Monorepo heavy commands inside `systemd-run --user --scope -q -p MemoryMax=4G
-p MemorySwapMax=1G -- <cmd>`; vitest `--maxWorkers=2`; turbo `--concurrency=2`. The
macOS builds are REMOTE (free public-repo minutes) — iterate deliberately, not
spam-fully. Dev Neon only locally; the PROD seed run is the planner's, never yours.

## Process

- Monorepo branch `feat/apex-appetize-stand` off `main`; PR against `main`. Conventional
  commits, all-lowercase subjects, body lines ≤150, footer lines ≤100. No comments in
  code; delete comments you touch.
- Fork work: direct commits to fork `develop` in `~/projects/contrib/tdp/mobile-ios-fork`.
- End every turn declaring BOTH trees' state (monorepo branch + clean/dirty + HEAD; fork
  branch + HEAD + last Actions run status).
- At the plan gate report, each with a recommendation: script placement + invocation
  command; upsert-key strategy + the abort-on-foreign-row guard; the published-day
  window/pattern + content shape; the exact Appetize create/update endpoints you found in
  the docs; Xcode selection strategy; anything ambiguous in either half.

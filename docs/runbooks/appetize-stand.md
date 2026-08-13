# Appetize stand: driving the real iOS app against the shim

The stand is the layer-2 end-to-end bench for the apex sunset. The **real** iOS app — the same
source the App Store binary is built from — is compiled for the simulator with its base URL
repointed at our platform shim at build time, uploaded to Appetize.io, and streamed in a browser.
Someone then signs in as a synthetic demo athlete and drives login → day → profile against the live
shim. It is the first pass where a human, not a test, exercises the whole compat vertical.

- Decision context: `docs/adr/0043-absorb-and-retire-legacy-mobile-stack.md`, initiative
  `initiatives/apex-sunset/` (D-5).
- Fork carrying the build: <https://github.com/maksim-pokhiliy/the-discipline-program-ios> (branch
  `develop`). The upstream app repo is untouched.
- The base URL is patched **inside the runner and never committed** — the fork's source always
  still points at the legacy host.

## Why the app reaches `/api/v1`

`TheDisciplineProgram/Utilities/Constants.swift` holds the origin; the app appends `/api` in
Release (`/dev-api` in Debug) and then `/v1`. The workflow patches only the origin and builds
`-configuration Release`, so the binary calls `<base_url>/api/v1/*` — byte-identical routing to the
shipped app. The app ships no ATS exemption, so the target must be HTTPS with a valid certificate.
That is why the default target is the production custom domain and not a Vercel preview URL:
previews sit behind Vercel SSO, which the app cannot pass.

## Running the build

```
gh workflow run appetize-stand.yml \
  -R maksim-pokhiliy/the-discipline-program-ios \
  -f base_url=https://platform.thedisciplineprogram.com
```

Or: the fork's **Actions → appetize-stand → Run workflow**, then fill `base_url`. Watch with
`gh run list -R maksim-pokhiliy/the-discipline-program-ios` and read the step table — do not trust a
`gh run watch` exit code. The job summary prints the Xcode version, the patched base URL, the
Appetize `publicKey`, and the app URL.

Where the credentials live, both on the fork:

| kind     | name                  | purpose                                     |
| -------- | --------------------- | ------------------------------------------- |
| secret   | `APPETIZE_API_TOKEN`  | Appetize REST auth (`X-API-KEY`)            |
| variable | `APPETIZE_PUBLIC_KEY` | the single app slot every later run updates |

The first successful run has no variable yet, so it **creates** an app; store the returned key so
every later run updates the same slot instead of burning a new one:

```
gh variable set APPETIZE_PUBLIC_KEY -R maksim-pokhiliy/the-discipline-program-ios -b <publicKey>
```

The app URL is `https://appetize.io/app/<publicKey>`. The app is left at Appetize's default
`authenticated` run permission on purpose — the link travels through public pull requests, and
streaming minutes are metered on the free tier. **Be signed in to Appetize before opening it.**

## Seeding the demo universe

The stand needs an athlete who can sign in and see a program. `shim-demo-seed` builds one that is
entirely synthetic: a demo coach, a `MobileConnection` (a NOT NULL foreign key only — no legacy
session exists behind it), a plan, an `INDIVIDUAL` publish link on `legacyUserId 990001`, the demo
athlete with a legacy identity, and 64 published days.

The link is `INDIVIDUAL`, never `GENERAL`. The athlete's days are keyed to his own synthetic
`legacyUserId`, so no real athlete can ever be served demo content. `990001` also sits outside the
legacy `1..24` range, so the P2.1 import cannot collide with it. The published days' wire ids start
at `990100` and are derived from the calendar date, which keeps them clear of real legacy row ids
for the same reason.

The script never deletes anything. Before its first write it runs a guard pass and aborts rather
than mutate a row it did not create. It refuses when: a `demo-*` user carries an unexpected role or
is soft-deleted; the demo coach's profile is not stamped with this script's marker bio, or carries
a real mobile connection; the demo athlete exists without a legacy identity, or with a legacy id
other than 990001; `legacyUserId 990001` is claimed by somebody else; more than one INDIVIDUAL link
carries 990001; or the link it finds points at a plan the demo coach did not create.

Two things it deliberately does rewrite on every run, both on rows the guards proved are ours: the
athlete's password, and the legacy identity fields. `0 created / 0 updated` in the summary is a
statement about published DAYS, not about those rows.

Every property of a day is derived from the **absolute date**, not from the run date: whether it is
a rest day, its content, and its wire `id`. A second run on a later day is therefore a genuine
no-op for the dates both windows share.

### Dev

```
cd packages/api-server
DATABASE_URL='<dev neon dsn>' \
SHIM_DEMO_ATHLETE_PASSWORD='<the stand password>' \
  pnpm --filter @repo/api-server exec tsx scripts/shim-demo-seed.ts
```

A bare invocation is a **dry run**: it resolves the target, prints it, prints the window it would
write, and touches nothing. Applying takes two more flags:

```
  --write --expect-host=<hostname>
```

`--expect-host` is not ceremony. Importing `@prisma/client` loads any `.env` sitting beside it, so
`DATABASE_URL` can arrive from a file nobody named on the command line — and this repository
carries three of them. Naming the host you expect is what makes the target deliberate; the script
refuses to write when the resolved host differs. The dry run prints the exact flag to copy.

`SHIM_DEMO_ATHLETE_PASSWORD` is held to the same 12..128 policy as every other password path in the
project, and surrounding whitespace is rejected rather than silently hashed into the credential.

### Production

Pull the DSN transiently, use it, delete it. Never paste a production DSN into a file that lives
longer than the command:

```
secrets="$(mktemp -d)"
trap 'rm -rf "$secrets"' EXIT
(cd apps/platform && npx vercel env pull "$secrets/prod.env" --environment=production)
DATABASE_URL="$(env -u DATABASE_URL node -e "process.loadEnvFile('$secrets/prod.env'); process.stdout.write(process.env.DATABASE_URL)")" \
SHIM_DEMO_ATHLETE_PASSWORD='<the stand password>' \
  pnpm --filter @repo/api-server exec tsx scripts/shim-demo-seed.ts
```

Read the target line, then repeat the command with `--write --expect-host=<the host it printed>`.

`vercel env pull` writes **every** production secret, not just the DSN — the session key, the blob
token, the mail key. Pull it to a temp directory outside the working tree with a `trap` that removes
it, never into the repository. `env -u DATABASE_URL` matters too: `loadEnvFile` does not override a
variable that is already exported, so without it a stale shell value would win over the file you
just pulled.

The password **must be identical on every run**. The script re-hashes and rewrites it each time, so
running with a different value silently rotates the credential out from under whoever holds it.

The demo athlete signs in as `demo-athlete@thedisciplineprogram.com`. The password is not in this
repository and never will be — both this repository and the iOS fork are public. It is held by the
owner and the planner.

The demo rows are visible in the internal admin console after a production seed: the demo coach in
the coach list, both demo users in the user list, the demo plan in the plan library (admins and head
coaches see every non-deleted plan), and both users inside the dashboard's user counts. That is
deliberate. A demo row that lies about its own history — soft-deleted at birth to hide it — is worse
than a visible one named `Demo Stand Coach`. Publishing from the demo plan is still blocked for
everyone but the demo coach, who has no password and cannot sign in.

Three standing constraints:

- **Never create a mailbox or catch-all for `demo-coach@` or `demo-athlete@thedisciplineprogram.com`.**
  Password reset mails a token to whoever receives that address, and consuming it sets a password on
  a live account — the coach one carries the COACH role.
- **Run the seed serially.** `TrainingPlan` has no unique key on (creator, name), so two operators
  seeding at once would fork the universe into two plans and two links.
- The window only ever grows. Days scheduled before an earlier run's window are never removed, so
  "64 days" describes a fresh seed, not the steady state.

## Verifying the seed

From the repository root:

```
RUN_SHIM_DEMO_CHECK=1 SHIM_DEMO_ATHLETE_PASSWORD='<the stand password>' \
  pnpm exec vitest run --project platform shim-demo-stand
```

The check is skipped unless `RUN_SHIM_DEMO_CHECK=1`, so it never runs in CI. It calls the real route
handlers in process — no dev server — and finds its own dates by asking the database which of the
seeded days are training and which are rest, so it validates the seed's output against the shim's
actual read predicate rather than re-implementing the seed's rules. It takes `DATABASE_URL` and `MOBILE_SHIM_JWT_SECRET`
from `apps/platform/.env.local` — but only for variables not already exported, since `loadEnvFile`
never overrides the shell. Unset `DATABASE_URL` in the session before running it if you have been
doing production work in the same shell, or you will verify a database you did not intend.

For production, curl the three endpoints directly rather than pointing this harness at it.

The seed's date rules — window size, rest cadence, `legacyRowId` derivation, the per-day date stamp
— are covered separately by `packages/api-server/scripts/shim-demo-days.test.ts`, which is a plain
unit test with no database.

## Driving the stand

Expected first-run behaviour, so it does not read as a defect:

- iOS raises its **notification permission dialog** the first time the main screen appears. Allow or
  deny; either is fine.
- An athlete sees exactly two tabs, Program and User. Create Program and Users Control are
  admin-only and correctly absent.
- Every screen an athlete can reach maps to a mounted shim route. The screens that call routes the
  shim does not serve (change training level, change plan, user list) are all behind the admin role.
- The app treats **only HTTP 200** as success. A 403 anywhere signs the session out — that is the
  legacy contract the shim reproduces on purpose.
- The Program tab renders one day per screen with previous/next navigation. Training days show a
  `Session date: <date>` line in the first block, so day navigation is visibly live. Rest days show
  `Today is the rest day`.
- The User tab offers **Change Password**, and it works — the demo athlete can rotate its own
  credential and lock everyone else out of the stand. Recover by re-seeding, which rewrites the
  password from `SHIM_DEMO_ATHLETE_PASSWORD`.

## Budget

Appetize streaming minutes are metered and scarce on the free tier. CI never launches a session — a
run's success is the upload returning 200 with a `publicKey`, nothing more. Streaming is a human
action, done deliberately.

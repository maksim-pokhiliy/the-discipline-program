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

Three things it deliberately does rewrite on every run, all on rows the guards proved are ours: the
athlete's password, the legacy identity fields, and the plan's status (back to `ARCHIVED` — see
below). `0 created / 0 updated` in the summary is a statement about published DAYS, not about those
rows.

Rewriting the password also bumps the athlete's `tokenVersion`, the same way every other
password-writing path in the project does. That revokes any shim token already issued, so **a
re-seed signs the demo athlete out of the app** — expect to log in again on the stand afterwards.
It is the point: a re-seed after a rotated password should not leave the old session alive.

Every property of a day is derived from the **absolute date**, not from the run date: whether it is
a rest day, its content, and its wire `id`. A second run on a later day is therefore a genuine
no-op for the dates both windows share.

### Dev

Read the password in rather than assigning it on the command line — an inline assignment lands in
shell history, and `HISTCONTROL=ignoreboth` does not save you because the line does not begin with
a space:

```
cd packages/api-server
read -rs SHIM_DEMO_ATHLETE_PASSWORD && export SHIM_DEMO_ATHLETE_PASSWORD
DATABASE_URL='<dev neon dsn>' \
  pnpm --filter @repo/api-server exec tsx scripts/shim-demo-seed.ts
```

A bare invocation is a **dry run**: it resolves the target, prints it, prints the window it would
write, and touches nothing. Applying takes two more flags:

```
  --write --expect-host=<hostname>
```

`--expect-host` is not ceremony. Importing `@prisma/client` loads any `.env` sitting beside it, so
`DATABASE_URL` can arrive from a file nobody named on the command line — this working tree carries
eight `.env*` files, seven of them holding a `DATABASE_URL`, and only `.env.example` is tracked.
Naming the host you expect is what makes the target deliberate; the script refuses to write when
the resolved host differs.

Two things about the value. It is a **hostname with no port**, because the guard compares
`URL.hostname`: `db.example.com` matches, `db.example.com:5432` never will. And it has to come from
somewhere other than the script — your own record of the database you meant, not the `target:` line
the run just printed. A host the tool derived and you pasted straight back attests to nothing, so
the dry run deliberately no longer offers one to copy.

`SHIM_DEMO_ATHLETE_PASSWORD` is held to the same 12..128 policy as every other password path in the
project, and surrounding whitespace is rejected rather than silently hashed into the credential.

### Production

Pull the DSN transiently, use it, delete it. Never paste a production DSN into a file that lives
longer than the command. Read the password in first, then run everything from `(` to `)` as one
block — the parentheses are what make the cleanup real:

```
read -rs SHIM_DEMO_ATHLETE_PASSWORD && export SHIM_DEMO_ATHLETE_PASSWORD
(
  secrets="$(mktemp -d)"
  trap 'rm -rf "$secrets"' EXIT
  (cd apps/platform && npx vercel@59 env pull "$secrets/prod.env" --environment=production)
  node -e "process.loadEnvFile('$secrets/prod.env'); process.stdout.write('expected host: ' + new URL(process.env.DATABASE_URL).hostname + '\n')"
  DATABASE_URL="$(env -u DATABASE_URL node -e "process.loadEnvFile('$secrets/prod.env'); process.stdout.write(process.env.DATABASE_URL)")" \
    pnpm --filter @repo/api-server exec tsx scripts/shim-demo-seed.ts
)
```

The parentheses are not cosmetic. An `EXIT` trap fires when the shell that set it exits, so pasted
bare into a terminal this block leaves every pulled production secret on disk until you close that
terminal. Worse, traps do not stack: paste the block a second time and the new trap **replaces** the
first, so the first temp directory is never removed at all. Inside `( … )` the trap belongs to the
subshell — it fires the moment the block ends, and a re-run gets its own.

`vercel env pull` writes **every** platform production secret, not just the DSN: the NextAuth
secret, the shim JWT secret, the mobile-publish encryption key, the cron secret, the blob
read-write token, the mail key, and the database URL. Pull it to a temp directory outside the
working tree, never into the repository. `vercel@59` is pinned on purpose — this is the most
privileged command in this document, and an unpinned `npx vercel` runs whatever the registry serves
that day. `env -u DATABASE_URL` matters too: `loadEnvFile` does not override a variable that is
already exported, so without it a stale shell value would win over the file you just pulled.

That `expected host:` line is the point of the extra `node -e`. It reads the hostname out of the
file you just pulled, which is a different derivation path from the one the script takes to its own
`target:` line. Compare the two: if they disagree, something other than `prod.env` supplied
`DATABASE_URL`, which is the exact accident `--expect-host` exists to catch. Then re-run the whole
block with `--write --expect-host=<that hostname>` appended to the `tsx` line, typing the hostname
rather than copying the script's output. The alternative independent source is the `DATABASE_URL`
entry in the Vercel dashboard.

The password **must be identical on every run**. The script re-hashes and rewrites it each time, so
running with a different value silently rotates the credential out from under whoever holds it.

The demo athlete signs in as `demo-athlete@thedisciplineprogram.com`. The password is not in this
repository and never will be — both this repository and the iOS fork are public. It is held by the
owner and the planner.

The demo rows are visible in the internal admin console after a production seed: the demo coach in
the coach list, both demo users in the user list, the demo plan in the plan library (admins and head
coaches see every non-deleted plan), and both users inside the dashboard's user counts. That is
deliberate. A demo row that lies about its own history — soft-deleted at birth to hide it — is worse
than a visible one named `Demo Stand Coach`.

The demo plan is seeded **ARCHIVED**, and every re-seed puts it back to ARCHIVED so a plan left over
from an earlier run converges too. Be precise about what that buys: archived blocks _editing_, so
nobody — admins included — can add weeks, days, sessions or rows to it. It does **not** block
publishing. Nothing in the publish path reads the plan's status; the only status check lives in
`verifyPlanEditable`, which the LMS editing endpoints call and the mobile-publish endpoints do not.

What actually keeps the stand's content honest is narrower, and worth stating plainly:

- The demo coach owns the only publish link to the plan and holds no password, so it cannot sign in
  to use it.
- An admin or head coach **is** granted the plan by `assertPlanAccess` and could create a publish
  link of their own against it. What they would publish is nothing: the plan carries no weeks and no
  days. The 64 days the stand serves are written straight into `MobilePublishedDay` by the seed and
  never pass through the plan's structure.
- The shim's read path never joins the plan at all, which is why archiving it is invisible to the
  athlete.

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
read -rs SHIM_DEMO_ATHLETE_PASSWORD && export SHIM_DEMO_ATHLETE_PASSWORD
RUN_SHIM_DEMO_CHECK=1 pnpm exec vitest run --project platform shim-demo-stand
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

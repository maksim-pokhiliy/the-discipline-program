# Runbook — legacy users import

Carries every row of the legacy Spring `users` table into the platform: a `User` row, a
`MobileLegacyIdentity` row, and the legacy bcrypt hash verbatim, so each athlete signs into the iOS
app after cutover with the address and password they already have.

Script: `packages/api-server/scripts/legacy-users-import.ts`. Dry run by default; writing takes two
more flags. It creates and refreshes its own rows and **never deletes anything** — the writer it is
handed has no delete method at all.

## The safety model in one paragraph

The script reads a **JSON export file**, never a second database, so no legacy DSN is ever handled.
Its only connection is the platform DSN in `DATABASE_URL`, and writing to that requires
`--write --expect-host=<hostname> --expect-plan=<digest>`, the host checked against the one the DSN
resolved to and the digest against the plan you reviewed. All writes happen inside one transaction,
and the whole run refuses if any row is in conflict — there is no partial apply and no override flag.

**A write must name the plan you reviewed.** The apply re-reads the database and re-decides inside
its own transaction, so the plan it would write is not necessarily the plan you signed off — someone
publishing a plan, an athlete changing a password, or a second import run in between all change it.
Every report prints a **plan digest**, and `--write` refuses without `--expect-plan=<that digest>`.
If the recomputed plan differs, the run refuses under its own heading, prints the plan the database
would produce **now** with its own digest, and writes nothing. That is not a failure to work around:
read the new report as you read the first one, and apply against the digest it prints.

What the digest covers is the **set of writes and the decisions behind them**, keyed by the person
each one is about — every action with its mirrored fields, every conflict, every warning. What it
deliberately does not cover is presentation: a platform user's display address shown on an ATTACH or
REFRESH line is not part of it, so renaming somebody's address on the platform between the review
and the write does not move the digest by itself (it moves the digest only if it changes what gets
written, for instance by changing which user a row matches). Nor do the reconciliation counts, so a
coach publishing an unrelated plan in the meantime cannot refuse an apply whose writes are the same.

**`--expect-host` is required in a dry run too, not only for `--write`.** Importing
`@prisma/client` loads any `.env` sitting beside it, so `DATABASE_URL` can arrive from a file
nobody named on the command line — a bare dry run could otherwise read a database you never meant
to open. A DSN carrying a `host=` **query parameter** is refused outright, because Prisma honours
that parameter over the host in the DSN authority and `--expect-host` would then attest to a host
the run does not connect to. The hostname comparison is case-insensitive, the way DNS is.

What the script withholds: the **DSN password and the resolved hostname** never appear in anything
it prints, report or error — a hostname the tool derived and you pasted straight back would attest
to nothing. What it cannot fully withhold: a raw driver error can still carry the **port, database
name and role**. Read driver errors on your own terminal and never paste one into a pull request,
an issue, or any other public artifact.

**The script never replaces an existing platform password unless you explicitly ask, and never one
it cannot prove it wrote.** Each identity carries `importedPasswordHash`: the hash **this import
last wrote** into that person's `User.password`, and nothing else. A restore happens only when that
marker is set **and** the stored credential is still exactly what the marker records — meaning
nobody has changed the password since — and then the new export hash is written to both. Anything
else is reported as `stored credential is not the one the import wrote` and left alone.

Consequences worth knowing:

- An **attached** platform user gets no marker at the moment of the attach: the import did not write
  their credential, so it has nothing to record. (A _later_ refresh can still record one, if by then
  their stored credential is byte-identical to the export hash — see the backfill below. The marker
  is a statement about the credential, not about how the row was first matched.) Legacy id 17, whose
  credential is deliberately withheld, likewise starts with none.
- A person whose **first sign-in re-hashed** their imported password at the platform cost factor no
  longer matches their marker, so a restore declines for them. That is correct and accepted: they
  know their password, and a restore would only take it away.
- A refresh whose stored credential **already equals the export hash** records the marker
  (`markers backfilled` on the summary line). That is safe by inspection — the credential in the
  database is the export's own hash, so writing it down changes nothing about what a later restore
  would do. The import **never clears a marker.**

That backfill leans on an invariant worth stating, because it is what makes "the stored credential
equals the export hash" mean "the import wrote it": **every production path that sets
`User.password` hashes a fresh plaintext with a fresh salt** — password reset, invite acceptance,
the shim's `changePassword`, user creation, and the AS-7 upgrade-on-verify. None of them can
coincidentally land on a hash from the legacy dump, because bcrypt salts differ per call. The import
itself is the only writer that copies an existing hash in verbatim. If a raw-hash writer is ever
added, this backfill needs revisiting before it does.

Restore still needs `--restore-credentials`; without the flag a differing credential is reported and
left alone. Use it only when you know the legacy password changed since the last import and you mean
to carry the new one across, and check the `credentials replaced` count afterwards.

### The consequence of the platform credential winning

Keeping the platform credential is the right call and it has a cost somebody has to be told about.
An athlete who accepted a platform invitation and typed their own password there now has **two**
passwords for the same account: the legacy one their phone remembers, and the platform one they use
on the web. The shim checks the platform one. So the moment the app starts talking to us, their
legacy app password stops working and **their app password becomes their website password**.

The report names exactly those people under `ACTION REQUIRED — app password changes`. A row is
listed when the export carries a credential, the person has a platform credential of their own, it
is not the export's hash, and the identity carries **no marker** -- the marker being absent is what
makes "the import never wrote this credential, so the person chose it" a fact rather than a guess.

Rows whose marker **is** set but no longer matches are deliberately **not** listed. That state has
two causes the script cannot tell apart -- the first-login re-hash, which keeps the same password, or
a real change since -- so it keeps its existing `stored credential is not the one the import wrote`
warning and claims nothing.

The list is derived, not written: it changes nothing this run does, so it does **not** enter the plan
digest. The digest pins what will be written. The list can only go stale in the safe direction --
this script is the only writer of the marker anywhere in the codebase, and somebody changing their
website password in between only keeps them on the list.

## 1. Produce the export

`row_to_json` is what the script's schema expects, and the schema is **strict** — an added or
missing column fails the run loudly rather than importing a partial row.

From the restored dump container:

```
mkdir -p .legacy-import
docker exec -e PGPASSWORD=<password> -i <container> psql -U <user> -d <database> -At \
  -c "select coalesce(json_agg(row_to_json(u) order by u.id), '[]'::json) from users u" \
  > .legacy-import/legacy-users.json
```

`.legacy-import/` is gitignored. **The export holds real addresses and real password hashes, and
the report holds real addresses.** Neither may be committed, pasted into a pull request, or copied
anywhere off the operator's machine.

## 2. Rehearse on a local throwaway database

Never rehearse against a shared database. Stand up a container, apply the migrations, and point the
run at it:

```
docker run -d --name tdp-import-local --memory=512m \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=platform_local \
  -p 127.0.0.1:5546:5432 postgres:17-alpine

DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5546/platform_local" \
  pnpm --filter @repo/api-server exec prisma migrate deploy
```

Then dry run, read the digest off the report, and apply against it:

```
cd packages/api-server
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5546/platform_local"
pnpm exec tsx scripts/legacy-users-import.ts --source=<absolute path> --expect-host=127.0.0.1
pnpm exec tsx scripts/legacy-users-import.ts --source=<absolute path> --expect-host=127.0.0.1 \
  --write --expect-plan=<the digest that dry run printed>
```

Run it from `packages/api-server` with `pnpm exec`, not `pnpm --filter … exec`: the filter wrapper
swallows the guard's refusal message and prints only its own exit-code noise.

Re-running the apply is safe and is the idempotency check: the second run must report
`create 0`, every row as a refresh, and `no change` on each. Take a fresh digest for it — the second
apply is a different plan from the first, and pinning the first one is exactly what the guard exists
to refuse.

The end-to-end probe (import → shim signin with the legacy password → `GET /user/{id}`) lives at
`apps/platform/src/app/api/v1/__tests__/legacy-users-import.integration.test.ts` and is opt-in:

```
cd <repo root>
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5546/platform_local" \
RUN_LEGACY_IMPORT_CHECK=1 SKIP_ENV_VALIDATION=1 \
  pnpm exec vitest run --project platform src/app/api/v1/__tests__/legacy-users-import.integration.test.ts
```

The `platform` vitest project only resolves from the repo root, not from `packages/api-server`.
The probe **writes** to whatever `DATABASE_URL` names and derives its own `--expect-host` from that
same DSN, so it refuses to start against anything but a loopback host.

Do not run the golden suite against a database that still holds rehearsal rows — the golden fixture
seeds legacy ids 1001..1004 and the same `@tdp.local` addresses, and the two collide. Clear the
rehearsal rows first, or use a separate container.

## 3. Production

The production DSN comes from the repo-root `.env.prod` — owner-held and gitignored, keys
`DATABASE_URL_PROD` (direct) and `DATABASE_URL_PROD_POOLER`. Use the direct one. Do **not** reach
for `vercel env pull`: the production `DATABASE_URL` is marked Sensitive in Vercel, so a pull writes
the literal string `[SENSITIVE]` while still dumping every other production secret to disk.

```
cd packages/api-server
DATABASE_URL="$(env -u DATABASE_URL_PROD node -e "process.loadEnvFile('../../.env.prod'); process.stdout.write(process.env.DATABASE_URL_PROD)")" \
  pnpm exec tsx scripts/legacy-users-import.ts --source=<absolute path> --expect-host=<hostname>
```

`env -u DATABASE_URL_PROD` matters: `loadEnvFile` does not override an already-exported variable, so
without it a stale shell value silently wins over the file.

Review the dry-run report, get the owner's sign-off, then re-run it with `--write` **and the
`--expect-plan=<digest>` printed on the report that was signed off**. The hostname is the **host
only, no port** (the guard compares `URL.hostname`), taken from your own record of the production
database — the Neon console or the Vercel dashboard entry — never from `.env.prod` itself, since the
DSN and its attestation must not share a source, and never from the script's output, which
deliberately offers none. The digest is the opposite: it exists to be copied out of the very report
that was reviewed, and copying it from anywhere else defeats it.

### Pre-cutover fidelity check

Before cutover, one run proves the mirror is faithful and the identities and links agree. It is a
**dry run** and writes nothing:

fresh SSH dump → restore → fresh export → dry run against production. Expect, on the summary block:

```
create 0 · attach 0 (link 0 / address 0) · refresh 19 · mirror diffs 0 · … · conflicts 0
RECONCILIATION individual links <n> · matched to a stored identity <m> · violations 0
```

- `refresh 19 · mirror diffs 0` — every legacy row is already mirrored, and not one mirrored field
  differs from the dump. This is the plan/level fidelity `/program` routes on.
- `violations 0` with a non-zero `matched to a stored identity` — every individual publish link that
  names a legacy id points at the same platform user the identity does. `violations 0` alongside
  `matched to a stored identity 0` proves nothing; read both numbers.
- `conflicts 0` — nothing anywhere contradicts anything.

Then work the two owner-action blocks before applying:

- [ ] every athlete under `ACTION REQUIRED — app password changes` has been told that from the
      cutover their app password is their **website** password, and that the way to reset it is the
      website's "Forgot password"; any of them reported as `shim DISABLED` is noted as unable to sign
      in at all until the legacy row is enabled
- [ ] every athlete carrying `matched platform user has no password of their own` has been dealt
      with by hand -- they have no credential on either side and cannot sign in until they set one

At the cutover dry run expect `app-password changes 7` — the seven athletes attached at P2.1
(legacy ids 1, 3, 9, 18, 22, 23, 24), one of whom (id 9) is disabled in the shim.

That report **is** the gate artifact. Keep it (on your own machine — it holds real addresses).

The published-day backfill (`legacy-days-backfill.md`) runs in the same window, off the same fresh
dump. Order does not matter between the two — they touch different tables — but both belong on the
cutover checklist in `apex-cutover.md`, and both want the FINAL dump.

### Apply-day freshness

The export must be made from a **fresh dump taken the same day**, not from an older snapshot.
Anyone who changed their password or their training level in the legacy app since the old dump
would otherwise be imported stale. The order is: fresh SSH dump → restore → fresh export → dry run
→ owner sign-off → apply with that dry run's digest.

### Re-runs are a pre-cutover tool — after cutover they are not

Before cutover the legacy app is the source of truth and the export is a faithful copy of it, so
re-running is safe and is how drift gets corrected.

**After cutover that stops being true.** The app writes back: `PUT /user` stores
`firstName`, `lastName`, `phoneNumber` and `dateOfBirth` straight onto the legacy identity, and
`changePassword` writes `User.password`. A `--write` re-run off a dump taken before cutover would
overwrite an athlete's own edits with values they already replaced in the app.

So: **do not re-run `--write` after cutover.** A dry run is always safe and stays useful for reading
the reconciliation. If a post-cutover write is genuinely needed, it is a deliberate decision made
with a specific reason, off an export you have checked row by row against what the app now holds —
not a routine re-run.

### What CI does and does not cover

Neither `RUN_LEGACY_IMPORT_CHECK` nor `RUN_LEGACY_INTEGRATION` runs in CI — both suites are
`skipIf`-gated and skip by default, exactly as the Appetize stand's probe does. CI therefore proves
the unit layers, types, lint and dependency boundaries, but **nothing about the script against a
real database**. Only these local runs cover: the CLI end to end, a real Prisma transaction rolling
back on conflict, the shim signing an imported athlete in with their legacy password,
`GET /user/{id}` serving the mirrored profile, a legacy-disabled account being refused, the
first-login credential upgrade, and the golden wire contract against the live legacy harness. Run
them before any production apply.

## 4. Reading the report

The head of every report is three lines: the counts, the reconciliation, and the digest. Nothing
hides below the fold.

```
create 19 · attach 0 (link 0 / address 0) · refresh 0 · mirror diffs 0 · login-address changes 0 · app-password changes 0 · credentials replaced 0 · markers backfilled 0 · conflicts 0 · warnings 1
RECONCILIATION individual links 4 · matched to a stored identity 4 · violations 0
plan digest 7f3a91c04e2b — pin it on the apply with --expect-plan=7f3a91c04e2b
```

- **mirror diffs** — how many refreshed rows had at least one mirrored field move. Zero on a
  faithful mirror; non-zero means the dump and the platform disagree about somebody's plan, level,
  enablement or profile, and the REFRESH section names the fields.
- **markers backfilled** — how many identities gained an `importedPasswordHash` this run because
  their stored credential was recognisably the export's own hash (see the safety model).
- **RECONCILIATION** — how many individual publish links carry a legacy id, how many of **those
  links** name a legacy id that has a stored identity to check against, and how many legacy ids
  came out contradicted. Read the middle number: it is how much of the gate was actually checkable,
  and `violations 0` beside `matched to a stored identity 0` proves nothing at all. One athlete can
  hold several links (one per plan), so the first two numbers count links while the third counts
  people. If the line reads `not assessed`, no row in the export was readable, so the database was
  never opened — the run refuses anyway, but nothing was checked.
- **plan digest** — the fingerprint of this exact plan, and what `--write` must be given.

- **CREATE** — a new platform user plus the identity. Shows the catalog ids, whether the account is
  enabled, and whether a credential came across.
- **ATTACH** — the legacy identity is hung on a platform user that already exists, matched either by
  an individual publish link or by the address. The platform user's password, role, name and address
  are **not** touched: that person keeps their platform credential.
- **REFRESH** — the identity already existed and its mirrored fields are being brought back in line
  with the export. This is what keeps the training plan and level faithful.
- **ACTION REQUIRED — login address changes** — see below.
- **ACTION REQUIRED — app password changes** — see below.
- **CONFLICTS** — nothing is written while any of these stand.
- **WARNINGS** — worth reading, but not blocking.

### ACTION REQUIRED — login address changes

When a legacy row is matched to a platform athlete through a publish link, and that athlete's
platform address differs from their legacy username, **their app login changes**. The shim looks the
user up by the platform address, so the login they have used for years stops working the moment
they are switched over.

This is not a warning to skim. Before applying in production:

- [ ] every athlete in this section is recorded, with their old and new address
- [ ] each of them will be told their new app login before cutover
- [ ] `credentials replaced 0` on the summary line, unless you deliberately passed
      `--restore-credentials`

### ACTION REQUIRED — app password changes

Each line names one athlete whose app password will be their platform password from the cutover:

```
[     3] name@example.com  matched by link  shim enabled  — from the cutover their app password is this platform password
```

- **matched by link / address** — how this legacy row was first tied to that platform person,
  reconstructed from the publish links and the addresses in the database, not from this run's action.
  On every run after the first these rows come back as REFRESH, which says nothing about how they
  were matched, so the report works it out again. `an unrecorded route` means neither a link nor the
  address points there any more; the identity still does, and it is still the same person.
- **shim enabled / DISABLED** — what the identity will hold after this run, which is what the shim
  gates sign-in on. A `shim DISABLED` athlete cannot sign in at all, password notwithstanding.

The count on the summary line is `app-password changes`. Read the section, not the count: the count
tells you how many people to talk to, the section tells you who.

### Conflicts

There is no `--allow-conflicts`. Resolve a conflict either by fixing the platform row, or by
removing that row from the export JSON and re-running — both are explicit and leave a trail.

`matched platform user is soft-deleted` has two shapes, and they resolve differently. If the person
was **never imported** and simply exists as a removed platform user, dropping their row from the
export is usually right — they left. If they were **already imported and then removed from the
platform**, their legacy identity still points at the removed user, so removing the row from the
export does not clear the conflict on the next run: restore that platform user, or delete the stale
identity row deliberately, before re-running.

`publish link and stored identity name different users` **cannot be cleared from the export at
all** — it is computed from this database alone, without reference to the dump, so deleting the row
changes nothing and the next run reports it again. Two rows in our own tables disagree about which
platform person a legacy id is: a `MobilePublishLink` says one, the `MobileLegacyIdentity` says
another. The app reads the identity, so if the identity is the wrong one somebody is being served
another athlete's training. Decide which of the two is right, then either **retarget or delete the
publish link** (it is a publish target, and re-publishing recreates it) or **move the stored
identity** onto the person it belongs to. This is reachable from ordinary product use — publishing
to an individual athlete rewrites the link's `legacyUserId` without consulting the identity table —
so it is worth resolving properly rather than papering over.

| Conflict                                                                | What it means                                                                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `username is not an email`                                              | the legacy username cannot become a platform address and has no ratified override                      |
| `ratified override no longer matches the source row`                    | the dump changed under an override; re-check before forcing anything                                   |
| `duplicate address in the export` / `duplicate legacy id in the export` | two rows collide, usually after a hand edit                                                            |
| `legacy catalog id out of range`                                        | role, plan or level is outside the legacy catalogs; importing it would make the shim 500 on every read |
| `publish link and address name different users`                         | the two kinds of evidence disagree; a human decides                                                    |
| `several publish links name different athletes`                         | one legacy id is linked to more than one platform athlete                                              |
| `matched platform user is soft-deleted`                                 | the person was removed from the platform                                                               |
| `matched platform user already carries another legacy id`               | one platform user cannot hold two legacy identities                                                    |
| `two legacy rows claim one platform user`                               | same, seen from the other side                                                                         |
| `the named platform user no longer exists`                              | a link or a stored identity points at nothing                                                          |
| `publish link and stored identity name different users`                 | one legacy person is mapped two ways; the app reads the identity, so a link says somebody else         |

### Warnings worth knowing

- `app login address changes` — promoted to its own section above.
- `matched platform user is not an athlete` — a coach or admin account also existed in the legacy
  app. The legacy role is mirrored but grants no platform privilege; imported users are always
  written with the platform role `ATHLETE`.
- `stored credential is not the one the import wrote; legacy hash not written` — the identity
  carries no marker, or carries one the stored credential no longer matches. Either the import never
  wrote this person's password (an attach), or it has changed since — on the platform, or by this
  person's first successful login re-hashing it. The script does not guess which; it keeps its hands
  off. The stored credential wins.
- `credential differs from the export and was NOT replaced` — the stored credential **is** the one
  this import wrote, and the export now holds a different one. Nothing was changed. Re-run with
  `--restore-credentials` only if you mean to carry the newer legacy password across.
- `stored credential REPLACED by the export hash` — you passed `--restore-credentials` and this
  person's stored password was overwritten. Check the `credentials replaced` count on the summary
  line matches what you intended.
- `the legacy address now belongs to a different platform user` — exactly that, and nothing moves:
  the identity stays where it is. (The same disagreement coming from a publish link is not a warning
  but a conflict — see the table above.)
- `matched platform user has no password of their own` — the legacy identity was hung on a platform
  user who has never set a password (an invitation that was never completed). A matched user's
  credential is never touched, so the legacy password is **not** carried across and that person
  cannot sign in until they set one. Worth resolving by hand before cutover.
- `stored identity missing from this export` — a legacy row that was imported before is gone from
  this dump. Nothing is deleted; decide by hand whether it should be.
- `synthetic address, no usable credential` — the ratified junk account (legacy id 17), imported
  disabled and with a null password so nobody can sign in as it.

  **Never create a mailbox for `legacy-admin@thedisciplineprogram.com`** — the same standing rule
  that already covers the two demo-stand addresses. This one matters more than the others: the
  address is published in a committed file in a public repository, and password reset gates only on
  `deletedAt`, not on whether the account has a credential or is enabled. A reset mail would carry
  a live token and turn an unreachable junk row into a working login. Its unreachability is a
  mailbox-policy guarantee, not something the code enforces.

- `legacy team has nowhere to go` — the identity table keeps no team.

### Scale

This is built for the legacy table's size — tens of rows, and comfortable to roughly ten thousand.
It reads the whole export into memory, holds one transaction open for every write, and prints a
line per row. Well beyond that the transaction timeout or the driver aborts the run, which is safe
(nothing is written) but not graceful. Nothing about the legacy table is anywhere near that.

## 5. After applying

- Sign in through the app (or the Appetize stand) as one imported athlete using their **legacy**
  password, and confirm the profile screen matches the legacy one.
- Confirm a legacy-disabled account is refused.
- Re-run the dry run: it should report every row as a refresh with `no change`.

The first successful sign-in of each imported athlete silently re-hashes their password at the
platform cost factor. That is expected and needs no action.

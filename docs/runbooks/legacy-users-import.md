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
`--write --expect-host=<hostname>`, checked against the host the DSN resolved to. All writes happen
inside one transaction, and the whole run refuses if any row is in conflict — there is no partial
apply and no override flag. Nothing the script prints — report or error — contains a password hash
or the resolved hostname: a hostname the tool derived and you pasted straight back would attest to
nothing, so even driver errors have the host scrubbed out of them.

Two guard details worth knowing. A DSN carrying a `host=` **query parameter** is refused outright
under `--write`: Prisma honours that parameter over the host in the DSN authority, so
`--expect-host` would otherwise attest to a host the run does not connect to. And the hostname
comparison is case-insensitive, the way DNS is.

**The script never replaces an existing platform password.** On a re-run it can _restore_ a
credential it wrote itself, but only when you pass `--restore-credentials` explicitly; without that
flag a differing credential is reported and left alone. Use the flag only when you know the legacy
password changed since the last import and you mean to carry the new one across.

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

Then dry run, and apply:

```
cd packages/api-server
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5546/platform_local"
pnpm exec tsx scripts/legacy-users-import.ts --source=<absolute path to the export>
pnpm exec tsx scripts/legacy-users-import.ts --source=<absolute path> --write --expect-host=127.0.0.1
```

Run it from `packages/api-server` with `pnpm exec`, not `pnpm --filter … exec`: the filter wrapper
swallows the guard's refusal message and prints only its own exit-code noise.

Re-running the apply is safe and is the idempotency check: the second run must report
`create 0`, every row as a refresh, and `no change` on each.

The end-to-end probe (import → shim signin with the legacy password → `GET /user/{id}`) lives at
`apps/platform/src/app/api/v1/__tests__/legacy-users-import.integration.test.ts` and is opt-in:

```
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5546/platform_local" \
RUN_LEGACY_IMPORT_CHECK=1 SKIP_ENV_VALIDATION=1 \
  pnpm exec vitest run --project platform src/app/api/v1/__tests__/legacy-users-import.integration.test.ts
```

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
  pnpm exec tsx scripts/legacy-users-import.ts --source=<absolute path to the export>
```

`env -u DATABASE_URL_PROD` matters: `loadEnvFile` does not override an already-exported variable, so
without it a stale shell value silently wins over the file.

Review the dry-run report, get the owner's sign-off, then append
`--write --expect-host=<hostname>`. The hostname is the **host only, no port** (the guard compares
`URL.hostname`), taken from your own record of the production database — the Neon console or the
Vercel dashboard entry — never from `.env.prod` itself, since the DSN and its attestation must not
share a source, and never from the script's output, which deliberately offers none.

### Apply-day freshness

The export must be made from a **fresh dump taken the same day**, not from an older snapshot.
Anyone who changed their password or their training level in the legacy app since the old dump
would otherwise be imported stale. The order is: fresh SSH dump → restore → fresh export → dry run
→ owner sign-off → apply.

## 4. Reading the report

The summary line counts every class, including the address changes, so nothing hides below the
fold:

```
create 19 · attach 0 (link 0 / address 0) · refresh 0 · login-address changes 0 · credentials replaced 0 · conflicts 0 · warnings 1
```

- **CREATE** — a new platform user plus the identity. Shows the catalog ids, whether the account is
  enabled, and whether a credential came across.
- **ATTACH** — the legacy identity is hung on a platform user that already exists, matched either by
  an individual publish link or by the address. The platform user's password, role, name and address
  are **not** touched: that person keeps their platform credential.
- **REFRESH** — the identity already existed and its mirrored fields are being brought back in line
  with the export. This is what keeps the training plan and level faithful.
- **ACTION REQUIRED — login address changes** — see below.
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

### Conflicts

There is no `--allow-conflicts`. Resolve a conflict either by fixing the platform row, or by
removing that row from the export JSON and re-running — both are explicit and leave a trail.

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

### Warnings worth knowing

- `app login address changes` — promoted to its own section above.
- `matched platform user is not an athlete` — a coach or admin account also existed in the legacy
  app. The legacy role is mirrored but grants no platform privilege; imported users are always
  written with the platform role `ATHLETE`.
- `platform credential kept, legacy hash not written` — that person changed their password on the
  platform. The platform credential wins.
- `credential differs from the export and was NOT replaced` — the stored credential looks
  import-written but no longer matches the export. Nothing was changed. Re-run with
  `--restore-credentials` only if you mean to carry the newer legacy password across.
- `platform credential REPLACED by the export hash` — you passed `--restore-credentials` and this
  person's stored password was overwritten. Check the `credentials replaced` count on the summary
  line matches what you intended.
- `matched platform user has no password of their own` — the legacy identity was hung on a platform
  user who has never set a password (an invitation that was never completed). A matched user's
  credential is never touched, so the legacy password is **not** carried across and that person
  cannot sign in until they set one. Worth resolving by hand before cutover.
- `stored identity missing from this export` — a legacy row that was imported before is gone from
  this dump. Nothing is deleted; decide by hand whether it should be.
- `synthetic address, no usable credential` — the ratified junk account, imported disabled and with
  no password so nobody can sign in as it.
- `legacy team has nowhere to go` — the identity table keeps no team.

## 5. After applying

- Sign in through the app (or the Appetize stand) as one imported athlete using their **legacy**
  password, and confirm the profile screen matches the legacy one.
- Confirm a legacy-disabled account is refused.
- Re-run the dry run: it should report every row as a refresh with `no change`.

The first successful sign-in of each imported athlete silently re-hashes their password at the
platform cost factor. That is expected and needs no action.

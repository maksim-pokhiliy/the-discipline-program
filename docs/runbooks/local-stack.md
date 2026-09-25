# Runbook — local stack

Every dev server, every test run and every migration rehearsal on a laptop targets this stack.
Dev Neon is a read-only reference for what the preview environment shows; it is not a test target
(storefront-billing D-14, 2026-09-25). Production is reachable only through the deliberate,
commented-out lines in the env files and the `db-migrate.yml` workflow (ADR-0042).

## What the stack is

- `docker-compose.yml` at the repo root, compose project `tdp-platform`, one service: `db`,
  `postgres:17-alpine`, container `tdp-platform-db`, bound to `127.0.0.1:5432`, data in the named
  volume `tdp-platform_db-data`, memory capped at 512 MB.
- Three databases, created on the first boot by `docker/db/init/01-databases.sql`:
  - `tdp` — the dev servers and every manual test;
  - `tdp_test` — the api-server integration suite (`task test:api`);
  - `tdp_shadow` — Prisma's shadow database for `pnpm db:migrate` (`prisma migrate dev`).
- Postgres **17**, not 16: production Neon runs 17.5, and a production dump restores into this
  container without a version dance (PG16 `pg_restore` cannot read PG17 custom-format dumps —
  apex-sunset learned this the hard way). CI stays on `postgres:16-alpine` as the floor, so a
  migration that only works on 17 still fails there.
- Credentials are `postgres` / `postgres` — the same placeholder CI uses; `scripts/check-secrets.mjs`
  knows the pattern, so the URL may appear in tracked files.

## First run

```bash
task stack:reset    # docker compose down -v && up --wait; migrate deploy into tdp + tdp_test; seed tdp
task stack:env      # prints the two env lines below
```

Put the printed lines into `packages/api-server/.env` (Prisma CLI + the api-server suite),
`apps/platform/.env.local`, `apps/admin/.env.local` and `apps/marketing/.env.local`. Keep the Neon
line commented above the local one — that is the only way back to reading preview data. Then
`pnpm dev`, or one app at a time.

```
DATABASE_URL="postgres://postgres:postgres@localhost:5432/tdp"
SHADOW_DATABASE_URL="postgres://postgres:postgres@localhost:5432/tdp_shadow"
```

Who can sign in after the seed:

| Account                                                           | Password             | Where                                                    |
| ----------------------------------------------------------------- | -------------------- | -------------------------------------------------------- |
| `dev-coach@thedisciplineprogram.com`                              | `password12345`      | platform `/coach`                                        |
| `dev-admin@thedisciplineprogram.com`                              | `password12345`      | admin `/`                                                |
| `demo-athlete@thedisciplineprogram.com` (after `task stack:demo`) | `demo-athlete-12345` | platform `/athlete`, iOS shim `POST /api/v1/auth/signin` |

`task stack:demo` runs `scripts/shim-demo-seed.ts` against `tdp`: a demo coach, the demo athlete
with a legacy identity, an archived plan with an `INDIVIDUAL` publish link and 64 published days
(`docs/runbooks/appetize-stand.md` describes the universe). Override the password with
`task stack:demo TDP_DEMO_PASSWORD=<value>` — and keep using the same value, the script rewrites
the hash on every run.

## Every day

| Command              | What it does                                                            |
| -------------------- | ----------------------------------------------------------------------- |
| `task stack:up`      | starts the container and waits for the health check; idempotent         |
| `task stack:down`    | stops it; the volume and its data stay                                  |
| `task stack:migrate` | `migrate deploy` into `tdp` and `tdp_test` — after pulling a migration  |
| `task stack:seed`    | re-seeds `tdp` (wipes domain data: plans, enrollments, products, users) |
| `task stack:reset`   | drops the volume and rebuilds everything from the migration history     |
| `task stack:psql`    | psql on `tdp`                                                           |
| `task stack:logs`    | tails Postgres                                                          |
| `task test:api`      | the api-server suite against `tdp_test`                                 |

Every task passes `DATABASE_URL` on the command line. Prisma's dotenv and `process.loadEnvFile`
both refuse to override a variable that is already exported, so a task can never drift to whatever
`.env` holds — the `Environment variables loaded from .env` notice Prisma prints is informational.
`packages/api-server/.env.test` is read by nothing.

Measured 2026-09-25 on the owner's WSL box: `task test:api` = 168 files / 1966 tests in 2 min 32 s.
The same suite took about ten minutes against dev Neon.

A port clash (`5432` already bound) is solved by `TDP_DB_PORT=5433 task stack:up`; pass the same
value to `task stack:env` and every other `stack:*` task. The compose file reads it as well.

## Authoring a migration

`pnpm db:migrate --name <change>` uses `tdp_shadow`; the separate Neon shadow branch ADR-0042
describes is no longer needed. Afterwards run `task stack:migrate` so `tdp_test` carries the new
migration too, or the next `task test:api` fails on the schema gap.

## Rehearsing against a production snapshot

The container's own client tools are PG17, so a Neon dump and its restore stay inside one version:

```bash
# dump — read-only on production; use the DIRECT (non-pooler) URL from .env.prod, never the pooler
docker compose exec -T db pg_dump "<production direct url>" -Fc > ~/tdp-prod-$(date +%F).dump
# restore into a fourth database in the same container
docker compose exec -T db createdb -U postgres prod_snap
docker compose exec -T db pg_restore -U postgres -d prod_snap --no-owner --no-privileges < ~/tdp-prod-$(date +%F).dump
# rehearse the pending migration against the snapshot
DATABASE_URL=postgres://postgres:postgres@localhost:5432/prod_snap pnpm db:deploy
```

Drop it with `docker compose exec -T db dropdb -U postgres prod_snap` when done. The dump holds real
athlete data: it stays on this machine, and it is never the `DATABASE_URL` of a dev server.

## Provider webhooks from the internet (Monobank, storefront-billing 0.2+)

Mono posts invoice and subscription events to the `webHookUrl` we register, so the platform dev
server on 3001 needs a public HTTPS address. `cloudflared` (installed 2026-09-25 as
`~/.local/bin/cloudflared`, release 2026.9.3 from GitHub) gives two options:

- **Quick tunnel** — `task stack:tunnel` (`cloudflared tunnel --url http://localhost:3001`) prints
  a random `https://<words>.trycloudflare.com` address, no account needed, new address every run.
  **It does not work from the owner's network:** `api.trycloudflare.com` times out on TCP (both
  IPv4 and IPv6, verified 2026-09-25) while `api.cloudflare.com` and the tunnel edge
  (`region1.v2.argotunnel.com:7844`) answer normally. Try it on another network; do not debug it.
- **Named tunnel (created 2026-09-25)** — `tdp-local`, id `d05202b4-77ef-4c24-8454-239e88c82314`, routed to
  `mono-dev.thedisciplineprogram.com` (a CNAME on the `thedisciplineprogram.com` zone in Vladyslav's Cloudflare
  account). The origin certificate and the tunnel credentials live in `~/.cloudflared/` on the owner's box
  and are never committed. Run it whenever a provider must reach this machine:

  ```bash
  task stack:tunnel                     # platform dev server: https://mono-dev.thedisciplineprogram.com -> localhost:3001
  task stack:tunnel TDP_TUNNEL_PORT=3999  # the spike's webhook receiver (mono-spike.mjs webhook:listen)
  ```

  Verified end to end the same day: a probe through the hostname reached a local receiver, and mono's webhooks
  arrived with a valid `x-sign`. `cloudflared` warns about ICMP proxy permissions on WSL; ignore it. To recreate
  from scratch: `cloudflared tunnel login` (browser, pick that zone) → `cloudflared tunnel create tdp-local` →
  `cloudflared tunnel route dns tdp-local mono-dev.thedisciplineprogram.com`. Delete the DNS route and the
  tunnel when the initiative closes.

`NEXTAUTH_URL` stays `http://localhost:3001` — webhooks carry no session, and Next's
`allowedDevOrigins` only concerns browser asset requests, not server-to-server POSTs.

## Troubleshooting

- **`docker compose up` fails to bind 5432** — something else owns the port; use `TDP_DB_PORT`.
- **Port 3002 answers a Django server** — that is another project's dev server on this box, not
  admin; run admin on a free port for the session: `pnpm --filter admin exec next dev --port 3012`.
- **Image pull fails with `docker-credential-desktop.exe not found`** — Docker Desktop's credential
  helper is missing from a non-interactive PATH; pull once from an interactive terminal. The image
  is already cached on the owner's box.
- **`postgres:alpine` without a tag** — never; PG18 moved the data directory and the volume mount
  breaks (mobile-publish P0 hit this). Stay on `postgres:17-alpine`.
- **`task stack:reset` took my hand-made plans** — it drops the volume by design; `stack:down` is
  the one that keeps data.
- **A dev server still talks to Neon after the env change** — Next reads `.env.local` at boot;
  restart it.

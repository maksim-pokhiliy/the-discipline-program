# 0043. Absorb and retire the legacy mobile stack

- **Status:** Accepted
- **Date:** 2026-08-07
- **Deciders:** Owner (with Denys's product sign-off; Vladyslav, the legacy author, consented)
- **Tags:** `architecture`, `legacy`, `mobile`, `migration`, `dns`

## Context

The product has run as two worlds since launch. The platform (this monorepo: Next.js apps + `api-server` + Neon Postgres) is where coaching happens. Separately, a legacy Spring Boot backend with its own Postgres — self-hosted on a Contabo VPS behind the apex domain `thedisciplineprogram.com` — feeds the live App-Store iOS app that athletes open in the gym. The two systems share no identity, no data store, and no deploy pipeline.

The `mobile-publish` initiative bridged them with a one-way connector: the platform pushes rendered day-projections into the legacy API as an ADMIN client. That bridge works, but it exists only because the legacy stack was untouchable at the time ("their dev is unavailable" — `mobile-publish` D-1), and it carries a standing complexity tax: monthly token reconnects, AES-encrypted foreign credentials, upsert emulation against an API with no unique constraints, a broken legacy PUT worked around with non-atomic DELETE+POST.

Three things changed. The owner and Denys decided the product must be ONE ecosystem with one database. Vladyslav consented to the legacy stack being modified or retired. And reconnaissance (2026-08-07, three parallel agents) established the decisive facts: the legacy DB holds ZERO athlete-generated data (7 tables — users, four catalogs, and free-text program days numbering in the hundreds); the legacy stack has zero external integrations (no push, no email, no storage, no cron); the iOS app is a ~3.8k-LoC read-only viewer whose base URL is hardcoded to the apex domain, which sits proxied behind Cloudflare under our control; only 9 of its endpoints are actually exercised, and their wire contract is already reverse-engineered and live-verified (`initiatives/mobile-publish/legacy-contract.md`). The legacy backend also carries IDOR-class holes (any authenticated user can modify or delete any other user), which argues for retiring it quickly rather than hardening it.

ADR-0020 §1 anticipated exactly this moment: URL-prefix versioning `/api/v1/*` was deferred "until the first external consumer (mobile app)".

## Decision

We absorb the legacy stack into the platform and retire it. The initiative `initiatives/apex-sunset/` executes this; its D-numbered decisions carry the step-level detail.

1. **The platform serves the legacy wire contract itself.** A compatibility shim implements the 9 live endpoints under `/api/v1/*`, byte-faithful to the verified contract (raw non-`Bearer` `Authorization`, HTTP-200-only success, `yyyy-MM-dd` dates, the `PROGRAM_ID` 409 header, never `isRestDay:false` with a null program). A bearer auth wrapper joins the existing session wrappers in `@repo/api-routes`.
2. **The iOS app is not modified** — no code change, no App Store release. It is repointed by taking over the apex domain (one proxied A record today; the cutover mechanism — DNS flip to Vercel vs a Cloudflare Worker route on `/api/v1/*` — is a step-level design). The app is a production surface, NOT legacy; its redesign on a real mobile API is a future initiative.
3. **All legacy users are imported** into the platform `User` table — full rows, no activity filtering, bcrypt hashes carried over (verified compatible: `bcryptjs.compare` validates `$2a`/`$2y`/`$2b`; legacy is Spring `$2a$10`), with the legacy integer id preserved in a mapping because the app sends `userId: Int` on every request.
4. **Publish becomes a snapshot in our DB.** The coach's Publish renders the day (the existing tested projection) and stores the result; the shim serves snapshots. The push-connector, the stored foreign tokens, and their cipher are torn down once the legacy API is gone.
5. **The legacy infrastructure is decommissioned**: both Spring backends (prod and `/dev-api`), the VPS Postgres (after a final archived `pg_dump`), and the Contabo server itself.

This ADR supersedes the "legacy is sacred / do not touch" constraint ratified in `mobile-publish` (charter Sacred, D-1). The overwrite-guard discipline protecting coach-authored legacy rows remains in force until the legacy DB is retired.

## Consequences

- **Positive:** One backend, one database, one deploy pipeline. The connector-era complexity class dies wholesale (`mobile-publish` MP-4/8/9/10/12/15 close "by decommission"). The legacy data — today existing as a single un-backed-up copy inside a Docker volume on one VPS disk — gains real durability in Neon. The IDOR-riddled public API goes away. The VPS subscription ends. The shim's bearer flow becomes the foundation for the future mobile-client redesign.
- **Negative:** The platform permanently carries a small legacy-shaped API surface (quirky formats, an integer id mapping) until the app is redesigned — that is the price of a zero-release repoint. The publish "snapshot" model adds a stored rendering the platform must keep consistent with its own display SSOT.
- **Neutral:** The apex domain's routing moves under our control (today it only fronts the VPS). The e2e story for the app changes: golden contract tests against the legacy docker harness gate the shim; a signing-free simulator build streamed via Appetize is the manual bench; the App-Store binary is rehearsed via LAN DNS-override before cutover. `mobile-publish` closes as superseded once the teardown lands.

## Alternatives considered

- **Keep the two-backend world, harden the connector (status quo).** Rejected: it IS the pain — two databases, publish shamanism, a foreign token lifecycle — and it leaves prod athlete-facing data on an un-backed-up VPS behind an IDOR-riddled API.
- **Rewrite the iOS app's data layer against a clean new mobile API now.** Rejected: it invests in a prototype-grade codebase (zero tests, no offline, iOS 18+, manual releases, author gone) and requires an App Store release just to reach parity. The shim reaches the same end-state (one backend) at zero Swift cost; the redesign happens later, on its own product schedule.
- **Sunset the app; athletes move to the platform web.** Rejected by the owner as product direction: athletes live on phones in the gym; the installed App-Store app is the athlete surface, and PWA is not an answer for this audience. The web athlete pages continue independently (post-uat Wd track), but not as the app's replacement.

## References

- `initiatives/apex-sunset/` — charter, plan P0–P4, decisions D-1..D-5 (the executing initiative; SSOT for step-level detail)
- `initiatives/mobile-publish/legacy-contract.md` — the verified legacy wire contract (the shim's spec)
- `initiatives/mobile-publish/{charter.md,decisions.md,deferred.md}` — D-1 (the superseded push-projection constraint), MP-NORTH-STAR (this ADR's ancestor)
- ADR-0020 §1 — `/api/v1/*` URL versioning reserved for the first external consumer
- ADR-0012 — JWT session strategy (the cookie world the shim's bearer wrapper sits beside)

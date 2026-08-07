# mobile-publish — charter

**Status: founded 2026-06-25; `initiatives/ACTIVE` since 2026-06-25.**

**Goal.** Plans authored in the new platform (`TrainingPlan → Week → Day → Session → Block → Schema → SchemaRow`) become publishable into the **legacy mobile stack** — Vladyslav's Spring backend at `thedisciplineprogram.com/api/v1`, which feeds the live App-Store iOS app — so a coach pushes a day/week of programming from the platform and his athletes see it in the existing iOS app, **without modifying the legacy backend or the iOS app** (their dev is unavailable; no legacy changes planned).

**Shape — the Connector model (ratified D-1/D-2/D-3).** Like a Claude/OAuth connector: a coach connects the mobile app from his platform profile (logs in with his own legacy ADMIN credentials → the platform stores his legacy token), **links** a platform plan to a mobile target (a training Level for the General channel, or a specific legacy athlete for the Individual channel), and gets a **Publish** button (day or week) that projects the plan's days into the legacy program rows via the legacy REST API.

**Why a push-projection, not a rewrite (D-1).** Legacy lives on; we are a pure ADMIN client of its existing API. The two systems are separate DBs with no shared identity — the connector's manual, coach-driven link IS the identity bridge (no email-matching, no account migration). The projection is lossy + one-way: structured schema rows render to the legacy free-text `dailyProgram` blocks; the iOS app only displays text, so display fidelity is preserved while structured features (per-athlete load resolution, benchmark logging) stay platform-only.

**Acceptance (properties, not tasks).** A coach connects the mobile app from his profile; links a plan to a Level or an athlete; clicks Publish (day/week); the legacy rows are created/updated idempotently; an athlete opening the iOS app on that date sees the projected programming; republishing an edited day updates in place and warns before overwriting a day authored outside the platform.

**Scope — 4 phases (see `plan.md`).** P0 local legacy harness · P1 connector + General publish (no identity bridge) · P2 Individual publish (coach links to a legacy athlete) · P3 hardening (republish / overwrite-guard / token-refresh UX / audit).

**Non-goals (→ where they go).**

- Repointing the iOS app at the platform API / retiring the Java backend → a FUTURE initiative (ADR-0005/0020 anticipate a mobile consumer); out of scope here (`deferred.md` MP-NORTH-STAR).
- Two-way sync (athlete results back into the platform) → no; publish is one-way projection.
- Baking per-athlete resolved weights into the General channel → impossible (shared by level); Individual-channel weight-baking is P2-optional (`deferred.md` MP-2).

**Sacred (do not touch).** The legacy Spring backend + the iOS app — we ONLY consume the legacy REST API as ADMIN. The platform's sacred `byProfile` load VO + resolver are read-only inputs to the projection. The legacy prod DB is inviolable (memory `prod-data-inviolable`) — every publish is idempotent + dry-runnable + guarded against clobbering coach-authored days.

> **Successor note (2026-08-07, ADR-0043 / `initiatives/apex-sunset/`).** The "legacy is untouchable" half of this constraint is SUPERSEDED: the legacy backend + its DB are being absorbed into the platform and retired (the blocker — the legacy dev's unavailability — lifted). Still in force until apex-sunset P3/P4 land: the legacy prod DB stays inviolable (final snapshot first), the overwrite-guard discipline stands, and the iOS app stays unmodified — now by apex-sunset D-1/D-2 (production surface, zero-release repoint), not by necessity.

**Stable working tree.** All TDP repos under `~/projects/contrib/tdp/`: `mobile-ios/` + `mobile-backend/` (full clones of Vladyslav's repos) alongside the platform monorepo (left in place). Local legacy stack via `tdp/local/docker-compose.yml`. The verified legacy wire contract lives in `legacy-contract.md`.

**Driving context.** memory `project-domain-architecture` (apex = legacy Spring API, don't touch); ADR-0005 / ADR-0020 (the API was designed anticipating a future mobile consumer); `docs/personas/denys.md` (the mobile app his clients use today).

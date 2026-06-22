# W1 — Catalog + admin · `/feature` prompt

**For an EXECUTOR session.** Open the session → `/initiative-resume` (loads charter / state / decisions — read them) → then run `/feature` with the brief below. W1 is the FIRST of 3 waves (see `plan.md`). Owner-smoke on the admin app after.

## What W1 builds — and ONLY this

A new first-class `ProfileAxis` catalog + its admin CRUD. One vertical slice DB → contract → API → admin-UI. Nothing else.

1. **Prisma** — new model `ProfileAxis { id @cuid, key String @unique, label String, values String[], createdAt, updatedAt, @@map("app_profile_axes") }` (confirm the map-name convention against neighbouring models). Migration via `prisma migrate` (repo on migrate since ADR-0042 — owner pre-approved the W1 migration). `db:reset` re-applies + seeds.
2. **Contract** (`@repo/contracts`) — a `ProfileAxis` entity schema + CRUD api schemas (list / create / update / delete, request + response). Place it where coaching/admin entities live, **NOT under `lms/`** (boundary below). Validation: `key` + `label` non-empty trimmed; `values` ≥1, each non-empty trimmed, **unique within the axis** — mirror the byProfile axis-values rule in `lms/_shared/load.ts` (the `superRefine` duplicate-value check).
3. **api-server endpoints** — `ProfileAxis` CRUD (list / create / update / delete). Auth-gated to MATCH the existing labels/exercises admin endpoints (same guard). Unique-`key` collision → the project's standard conflict error (find how labels/exercises signal a dup).
4. **Admin app** — a "Profile Axes" CRUD module. FIND the existing **labels** (or **exercises**) admin module and MIRROR its pattern exactly — list table + create/edit form + delete. Don't invent a new shape; reuse the app's table / form / dialog primitives.

## Read first (verbatim — don't re-derive)

- This initiative: `charter.md` (D-1/D-2 ontology + the sacred boundary), `plan.md` (W1 locked details), `decisions.md`.
- `packages/contracts/src/entities/lms/_shared/load.ts` — the byProfile axis-values validation to mirror (unique, non-empty, trimmed).
- The existing admin **labels** (and/or **exercises**) module END-TO-END — Prisma model → contract → endpoints → admin UI — as the CRUD pattern to copy. grep across `apps/admin`, `packages/api-server`, `packages/contracts`.
- ADR-0042 (prisma-migrate workflow) + the project `CLAUDE.md` db rules.

## Guardrails (HARD — W1 stays inside these)

- **DO NOT touch the `byProfile` load VO** (`load.ts`). That's W2 — sacred (`plan-editor-compose/D-PERSIST`), gated on D-3 + a four-projection re-check. W1 adds a SEPARATE catalog table; the load keeps free-string axes until W2.
- **DO NOT touch the resolver** (`endpoints/lms/athlete-records/resolve-load.ts`, `load-records.ts`), the athlete profile, or the coach load-editor (`load-by-profile-fields.tsx`). Those are W2/W3.
- **Boundary:** `ProfileAxis` lives in coaching/admin territory, NOT `lms/`. The lms code must NOT import it (`api-server-lms-no-coaching` dep-cruiser rule — pre-push `dep:check` fails the push otherwise). By design the resolver never needs the catalog table (it reads only the load VO + profile selections) — keep it that way; don't add a convenience read.
- **gender stays a typed column** — W1 adds NO link between `ProfileAxis` and `gender`. The catalog holds training-classification axes only (D-1). Don't "helpfully" wire identity in; that's W2's discriminated-union.
- **No closed enum of axes** — axes are catalog rows (D-2). Don't seed a hardcoded RX/SC/M-F enum anywhere.
- **Tests:** the `@repo/api-server` suite is GATED (manual approval, ~10 min serial — `api-server-serial-tests`). Do NOT run it unprompted. `check-types` + `lint` + per-package contract/admin unit tests are fine; ASK the owner before the api-server suite.

## Acceptance (properties, not tasks)

- Admin creates / edits / deletes a profile axis (key + label + ordered values).
- Duplicate `key` is rejected with the standard conflict error; empty/duplicate values are rejected by the contract.
- `check-types` + `lint` green; the admin module matches the labels/exercises pattern (no bespoke shape).
- `git diff` confirms ZERO change to `load.ts` / resolver / athlete profile / coach load-editor (the radius is the catalog + admin only).

## Owner smoke (after the run, on dev)

`db:reset` (re-applies the migration + seeds) → admin app (port 3002) → Profile Axes → create `level` with values `RX` / `SC`, edit a value, delete the axis. That closes W1. W2 (coach binding — sacred-VO, decision-first) is the NEXT executor session, and its FIRST task is the plan-editor-compose ratification + four-projection re-check (D-3), BEFORE any VO code.

# 0031. Scheme params as discriminated JSON

- **Status:** Accepted
- **Date:** 2026-04-26
- **Tags:** `lms`, `schema`, `validation`

> Status flipped from Proposed to Accepted: discriminated-JSON scheme params have landed and are referenced by ADRs 0027, 0034, 0035 plus `packages/contracts/README.md`.

## Context

A `BlockSegment` carries the execution mode for a slice of a workout — AMRAP, EMOM, intervals, time-boxed compositions, plain count-up sets, no scheme at all. Each mode has its own parameter shape: AMRAP has a duration; EMOM has total minutes plus a slot pattern with a cycle length; intervals have a set count and a slot list; time-boxed has nested per-segment archetypes.

The shape space is bounded but not flat. The design (see `docs/design/workout-redesign.md` §3.5 and §5) collapses the entire CrossFit canon — AMRAPs, For-Time, EMOMs, Tabata, intervals, ladders, wave loading, chippers, hero WODs, time-boxed mixes — onto six execution archetypes: `NONE`, `COUNT_UP`, `COUNT_DOWN`, `INTERVAL_LOOP`, `EMOM_LOOP`, `TIME_BOXED`. The archetype enum is bounded because each archetype binds to a hardcoded timer state machine in `@repo/workout-engine` (M3); a seventh archetype is a code change, not a database row.

The question is how to store parameters that vary by archetype.

Two clean options.

- **One table per archetype.** Strict typing at the DB level. Six tables. Joins through a discriminator. Nested `TIME_BOXED` segments — which embed an `innerArchetypeKind` and `innerParams` — get a recursive table or an awkward JSON-inside-relational compromise.
- **One JSON column with a discriminator.** Validation moves to the application layer (zod). Unindexable for queries that look inside parameters. One table.

Per-archetype tables are six times the schema surface for a parameter set that analytics never reads — analytics rolls up exercises and load, not scheme metadata. Pure JSON without a discriminator loses correctness — nothing prevents `archetypeKind = EMOM_LOOP` paired with `schemeParams = {kind: "COUNT_UP"}`.

We want the storage simplicity of JSON with the correctness floor of relational integrity.

## Decision

`BlockSegment` has two correlated columns:

- `archetypeKind: SchemeArchetypeKind` — enum with six values. The discriminator.
- `schemeParams: Json` — the parameter payload, validated by a zod discriminated union with the same six discriminator literals.

A database CHECK constraint enforces that the JSON discriminator matches the column discriminator:

```sql
ALTER TABLE lms_block_segments
  ADD CONSTRAINT chk_scheme_params_kind_matches
    CHECK (scheme_params->>'kind' = archetype_kind::text);
```

Validation is layered:

1. **Application write path** — every endpoint that creates or updates a `BlockSegment` parses `schemeParams` against `schemeParamsSchema` (the zod discriminated union in `packages/contracts/src/entities/lms/_domain/scheme-archetype.schema.ts`). Bad input is rejected with a 400 before it reaches the DB.
2. **Database write path** — the CHECK constraint is the safety net. If application code ever inserts `archetypeKind = EMOM_LOOP` with `schemeParams = {kind: "COUNT_UP"}` because of a bug, the DB rejects it.
3. **Application read path** — every mapper that reads a `BlockSegment` parses `schemeParams` against the same schema. Stale rows (e.g., from a future schema change) fail loudly, not silently.

The same pattern applies to the discriminated unions inside `prescriptionSchema` (e.g., `LoadSpec`, `RepSpec`, `RestSpec`) — those are not separately CHECKed because they live nested inside the larger `prescription` JSON, but they are validated in the same three layers. The CHECK constraint is reserved for the scheme-archetype-vs-schemeParams relationship because that one alignment is critical to timer rendering.

CHECK constraint SQL lives in `packages/api-server/prisma/sql/lms-checks.sql` and is applied by a `db:push` wrapper script (a tsx script that calls `prisma.$executeRawUnsafe` after the schema sync). Prisma 6 has no first-class CHECK support; the SQL file is the canonical record.

## Consequences

**Positive:**

- One table for all block segments regardless of archetype.
- Recursive `TIME_BOXED` segments embed cleanly (the inner archetype is just another `kind` discriminator inside the JSON).
- Adding a seventh archetype later — if the timer team ever needs one — is an enum addition and a new branch in the zod union, no new table or migration of existing rows.
- Application + DB enforce alignment; correctness does not depend on every contributor remembering to validate.

**Negative:**

- `schemeParams` is not directly indexable. Queries like "find all blocks where the EMOM cycle length is 4" require a JSONB GIN index, which we do not add by default. Acceptable: such queries are speculative and not on any roadmap. A GIN index can be added later without schema changes.
- The DB CHECK is enforced via raw SQL outside Prisma's schema. The wrapper script must be invoked on every `db:push`/`db:reset`. Wrapping in `package.json` scripts mitigates the foot-gun, but a contributor who runs `prisma db push` directly will skip the constraint. Mitigated: a `db:push:prisma` escape hatch is documented for ad-hoc work, and the wrapped `db:push`/`db:reset` are the canonical commands.
- Three-layer validation (write zod → write DB → read zod) is verbose. We pay this once via shared mapper helpers that call into the schema; consumers do not write validation code.

**Neutral:**

- The zod schema is the single source of truth for what a valid `schemeParams` looks like. Storybook stories and form components consume the same union to drive `SchemeFormFor[Archetype]` editors.
- Postgres `JSONB` is the storage type (Prisma `Json` maps to `jsonb` on Postgres). Comparison via `->>` is sub-microsecond on row-level scans.

## Alternatives considered

**One table per archetype.** Discussed above. Rejected: 6× the schema surface, painful nested `TIME_BOXED`, future archetype = new table, no analytics value.

**Pure JSON without a discriminator column.** All parameters in `schemeParams`, no separate `archetypeKind` enum, the timer FSM dispatches purely on `schemeParams.kind`. Rejected: violates the principle that the DB should know the basic shape of what it stores. List-and-filter queries (`WHERE archetype_kind = 'EMOM_LOOP'`) become JSON path queries, slower and harder to read. The single-column extra cost is trivial.

**Application-only validation, no DB CHECK.** Rejected: any bug in any future endpoint can put the DB in an inconsistent state that the read-path validation will then catch as a runtime error in production. The CHECK is cheap insurance against a category of bugs we cannot eliminate by code review alone.

**Separate JSON columns per archetype** (`countUpParams`, `emomParams`, etc.) with the unused ones NULL. Rejected: ugly, eight nullable columns instead of one, and the discriminator-vs-payload-shape correctness problem returns at the column level.

## References

- `docs/design/workout-redesign.md` §3.5 (zod schemas) and §3.6 (relational vs JSON trade-off).
- `packages/api-server/prisma/sql/lms-checks.sql` — the CHECK SQL.
- `packages/api-server/scripts/apply-sql-checks.ts` — the wrapper that applies them.
- ADR-0027 — the structural rewrite that introduces `BlockSegment`.

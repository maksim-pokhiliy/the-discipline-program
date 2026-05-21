# Step 08.3.6 — `SchemaRow @@unique([schemaId, order])` composite-uniqueness constraint

- **Date**: 2026-05-21
- **Feature-dev artifacts**: `.feature-dev/1779369474/` (research / review / tasks — `/feature small` pipeline).
- **Prompt**: `implementation/step-08.3.6/prompt.md` (planner-written 2026-05-21; spec-only, two-voice; D-8.3.6-1..7 ratified upfront).
- **Output**: `implementation/step-08.3.6/output.md` (executor self-report — 14/14 acceptance MET).

## Summary

`@@unique([schemaId, order])` added to the `SchemaRow` Prisma model — DB-level enforcement of the positional-uniqueness invariant, the structural mirror of Step 7.3.6's `Block @@unique([sessionId, order])`. A latent surface closed before the Step 8.4 schema editor drives concurrent SchemaRow writes: `SchemaRow` carried `@@index([schemaId, order])` but no `@@unique`, so two rows in one schema could silently hold the same `order` under a concurrent write.

**The load-bearing finding — `lmsSchemaRowApi.reorder` was NOT rewritten.** The `04-next-action.md` handoff brief (and the planner brief that opened the session) assumed a single-pass reorder needing a two-pass rewrite — mirroring Step 7.3.6's _outcome_. Verbatim-read at thesis time (`schema-row/admin.ts:190-246`) + `git blame` corrected it: `lmsSchemaRowApi.reorder` was shipped in Step 8.1b (`e1091719` — commit subject literally _"two-pass reorder"_) **already** in the canonical two-pass shift-to-negative form. The Step 8.1b executor had already internalized the flavour-(h) lesson 7.3.6 surfaced. The flavour-(h) `[[planner-mutation-invariant-trace]]` intra-tx trace was run upfront (prompt § 5 axis 3) and the verdict is the _inverse_ of the 7.3.6 anti-precedent: Phase 1 stages every row to `-1..-N`, Phase 2 to `10..N*10`, every intermediate UPDATE holds a pairwise-distinct `order` — the constraint is compatible with **zero** changes. `schema-row/admin.ts` is byte-identical after this step (D-8.3.6-3). Scope vs the brief's assumption: not "constraint + reorder rewrite + 2 tests" but "constraint + 1 test", `admin.ts` untouched.

**1 atomic commit + close-out docs** (`b32fd892`, base the prompt commit `a42f17cf`):

1. `b32fd892 feat(training-domain): add unique constraint on schemarow (schemaid, order)` — 5 files, +41/−0, purely additive: `packages/api-server/prisma/schema.prisma` (`@@unique` on `SchemaRow`) + the `analysis/06-formalization/` sync (`schema.prisma` mirror, `er-final.md` § 5 invariant #12, `implementation-notes.md` § 4.11) + `schema-row/admin.test.ts` (+1 P2002-floor test).
2. The close-out docs commit (this entry + state files).

Single-package code scope; `@@unique` is type-system-neutral (no Prisma client type-shape change) → no cross-package fan-out, no broken intermediate tree → one atomic commit, no squash (D-8.3.6-7, mirror Step 7.3.6 `85866ba1`).

**Planner spot-check** (verbatim `git show b32fd892`):

- **Live `schema.prisma`** — `@@unique([schemaId, order])` placed immediately before `@@index([schemaId, order])`, both retained, `@@map("training_schema_rows")` last — the live `Block`/`Week`/`Day` canonical pattern.
- **Analysis mirror `schema.prisma`** — the identical `@@unique` line, no `@@map` (the analysis spec is pre-port).
- **`er-final.md` § 5** — new invariant #12 after #11, before the `---`; byte-identical to prompt Phase 2b. § 4 cardinality matrix untouched.
- **`implementation-notes.md`** — new § 4.11 after § 4.10, before `## §5`; byte-identical to prompt Phase 2c — including the second paragraph that records the reorder _non_-change (the § 4.7 contrast).
- **`schema-row/admin.test.ts`** — one new case `enforces composite uniqueness on (schemaId, order) via P2002` in the `cross-cutting` describe: `provisionSchema` → raw `cleanupRaw.schemaRow.create` at `(schemaId, order: 10)` → a second raw-create at the same tuple `rejects.toMatchObject({ code: "P2002" })` → `count` `toBe(1)`. Structural mirror of Step 7.3.6 case 10; the `REST_SLOT` (`rowKind` + `rowPayload`) shape covers `SchemaRow`'s extra non-nullable columns.
- **`schema-row/admin.ts`** — **not in the diff** (`git log -- …/schema-row/admin.ts` shows only `e1091719`). D-8.3.6-3 confirmed verbatim — the reorder was correctly not rewritten.
- scope confined: `git diff a42f17cf..HEAD` is exactly the 5 prompt § 2 files + `step-08.3.6/output.md`; `apps/*`, contracts, mappers, routes, seed, `prisma/sql/`, `domain-model.md`, the stress files — 0 lines.

Verifications (planner re-ran `pnpm check-types` — 16/16, FULL TURBO): `pnpm check-types` 16/16 · `pnpm lint` 16/16 (0 warnings) · `pnpm test` 1692/1692 (132 files; +1 over the 1691 baseline) · `pnpm dep:check` 0 violations, no module-count delta · `schema-row/admin.test.ts` 32/32 (31 baseline + 1) · `db:reset` + `db:seed` clean (0 `SchemaRow` seed inserts). Husky pre-commit + commit-msg clean on the code commit; zero `--no-verify` / `--no-edit` / `--no-gpg-sign`. `/feature small` Stage 5 Review-Light **APPROVED** (0 CRITICAL / 0 WARNING / 0 INFO — an independent agent verified the analysis paragraphs byte-identical, the test line-by-line, the sibling-test `cleanupRaw.schemaRow.create` fixtures non-colliding).

## Open questions resolved

Three executor questions, all resolved without planner escalation:

- **Q-1 / D-EXEC-2 — `.env.test` database fork (good vigilance).** `packages/api-server/.env.test` exists with a different Neon host (`ep-autumn-brook-…-pooler`) than `.env` (`ep-quiet-sunset`, the DB `db:reset` targets). A real risk: had vitest loaded `.env.test`, the prompt's `db:reset` → `test` chain would prep the wrong DB and the P2002-floor test could false-fail. The executor resolved it empirically — a throwaway probe inside `vitest run` confirmed the test process connects to `ep-quiet-sunset` (the `.env` dev DB). `.env.test` is a stale, gitignored, local-only orphan (likely a leftover of the dropped e2e suite — `[[e2e-dropped]]`); not touched. Not a prompt error; the prompt's Phase 3→4 chain is correct. **An environment-invariant check the prompt did not call out** — adjacent to the flavour-(h) discipline; the executor caught it unprompted.
- **Q-2 — § 0.A grep 1 surfaced 4 unenumerated test files.** `grep "cleanupRaw.schemaRow.create"` hit `week/admin.test.ts` (orders 10/20 + 20/10 — distinct), `day/admin.test.ts:318`, `schema/admin.test.ts:862`, `guards.test.ts:403` (single row each) — beyond the prompt § 0.A item-1 abbreviated "Expected" list. The executor read each verbatim, confirmed none inserts a duplicate `(schemaId, order)` → constraint-compatible. The exact replay of Step 7.3.6 Q-1 (an abbreviated § 0.A enumeration, not real drift) — proceeded without escalation.
- **Q-3 — § 0.8 `create`-describe count off by one.** The prompt § 0.8 parenthetical says the `create` describe has 15 cases; the actual count is 14. Cosmetic, zero impact — the § 8 `pnpm test` baseline of 1691 is exact, and the run confirmed 1692 (1691 + 1). Noted, no action.

## Deviations

**14/14 acceptance MET.** No structural deviation — `@@unique` placed per § 0.2 in both schemas, both analysis paragraphs byte-identical, the new test a faithful mirror of 7.3.6 case 10, `schema-row/admin.ts` byte-identical. One executor pipeline-order choice (D-EXEC-1) — ran the `/feature small` stages Implement → Test → Review (not Implement → Review → Test) so Review-Light saw the complete diff including the new test; sound.

## Analysis-artifacts touched

`06-formalization/{schema.prisma, er-final.md, implementation-notes.md}` — the Prisma schema change synced per WORKFLOW.md `analysis/` rules: the `schema.prisma` mirror (`@@unique`), `er-final.md` § 5 invariant #12, `implementation-notes.md` § 4.11. `05-synthesis/domain-model.md` UNTOUCHED (entity semantics unchanged — `SchemaRow` was already conceptually unique-per-position via sparse-int ordering #7; the constraint is engineering enforcement, not a domain-model change — mirror Step 7.3.6). `06-formalization/stress-final.md` + `05-synthesis/stress-test.md` UNTOUCHED (no new edge case drove this — it is a latent regression surface, not a stress case). § 4 cardinality matrix UNTOUCHED (uniqueness lives in § 5 per the #8/#10/#11 convention).

## Smoke-test status

**N/A** — backend/DB step (a schema constraint + analysis sync + 1 integration test). No runtime UI; the constraint is verified by the api-server test. UI smoke resumes at the Step 8.4 anchor.

## Process note

**Validation verdict: clean — Review-Light APPROVED (0 findings), all gates green (planner re-ran `check-types` 16/16 FULL TURBO), the load-bearing facts confirmed verbatim: `@@unique` before `@@index` (both schemas), the two analysis paragraphs byte-identical, the P2002-floor test a faithful 7.3.6-case-10 mirror, and — the central one — `schema-row/admin.ts` byte-identical (D-8.3.6-3).** Step accepted. Zero escalations — all three executor questions resolved within the ratified intent.

**Planner-discipline note — flavour (h) `[[planner-mutation-invariant-trace]]` applied correctly, against a wrong handoff assumption.** The session brief and `04-next-action.md` both asserted a single-pass `lmsSchemaRowApi.reorder` needing a two-pass rewrite — the brief had mirrored Step 7.3.6's _outcome_ (a reorder rewrite) without accounting for the Step 8.1b executor having already shipped the reorder two-pass. The planner read `schema-row/admin.ts` + `git blame` verbatim **at thesis time** (before prompt-write), found the method already two-pass, ran the intra-tx trace, and inverted the thesis: constraint-only, no rewrite, `admin.ts` out of scope. This is flavour (h) used as intended — a trace before speccing, not an instinct — and it caught the inverse of the 7.3.6 anti-precedent (7.3.6 § 5 wrongly said "no violation possible"; here the brief wrongly said "rewrite needed"). The narrow lesson: a handoff brief that frames step N as "mirror step M" can carry M's _outcome_ as an assumption — verify the current code state before adopting it. Covered by the existing flavour (c) `[[planner-verbatim-registration]]` ("Read verbatim at prompt-write time") + the `[[verify-before-folding-to-pushback]]` stance — not a new flavour, not memory-worthy on its own.

**Planner-discipline note — flavour (c) adjacent, § 0.A enumeration abbreviated again (Q-2).** The prompt § 0.A grep-1 "Expected" line was abbreviated ("week/day read includes, test fixtures") rather than an exhaustive callsite list — the executor surfaced 4 unenumerated test files, read them, cleared them. This is the exact replay of Step 7.3.6 Q-1, whose close-out flagged that future § 0.A enumerations should either be exhaustive or explicitly marked non-exhaustive. The 8.3.6 prompt did not apply that refinement. Zero-impact (the executor's verbatim-read cleared it cleanly, the `/feature small` Research stage is built for exactly this), but worth recording: the next constraint-step prompt's § 0.A should carry the non-exhaustive marker or the full list. Adjacent refinement of flavour (c); not a new flavour, not memory-worthy on its own.

**Next planner action**: Step 8.3.7 — `Schema` partial-unique constraint (`@@unique([parentSchemaId, order])` Prisma DSL for sub-schemas + a `schemas_block_top_order` partial index in `apply-sql-checks.ts` for top-level schemas WHERE `parent_schema_id IS NULL` + a dual-scope reorder check). See `state/04-next-action.md`.

# Next planner action

> Concrete next-action handoff brief. Updated every close-out as the queue shifts.

## Step 8.1c thesis cycle — `lmsSchemaPairingApi` server endpoints

**Scope summary**: Last api-server slice of the Schema vertical (8.1a Schema → 8.1b SchemaRow → **8.1c SchemaPairing**). `lmsSchemaPairingApi` basic CRUD for the SchemaPairing entity — links two schemas with a `relationKind` (e.g. `ALTERNATING_SETS`) for super-set-style execution. Per D11: SchemaPairing **UI is deferred** (inter-schema operation, coach survives без it initially) — 8.1c ships backend only. `verifySchemaPairingOwnership` guard + `mapToSchemaPairing` mapper + api method set.

**Wrapper**: `/feature small` — thin scope (basic CRUD, no reorder complexity, no discriminated payload, UI deferred). Carve-out per `[[always-via-feature-skill]]` may apply (single-package api-server slice, thin-additive) — planner picks `/feature small` vs full at thesis-lock per actual scope estimate.

## Two process shifts active from Step 8.1c

1. **`[[coach-walkthrough-gate]]`** — the 8.1c thesis coach view MUST carry a 1-paragraph coach walkthrough. SchemaPairing is backend-only, so the walkthrough describes the **final coach UX it contributes to** (per gate rule for infrastructure steps): «Денис создал в блоке две schema — squat sets + bench sets — хочет чтобы атлет выполнял их alternating (A1/B1 super-set). Связывает их как pair, видит visual link indicator между двумя schema-карточками. SchemaPairing backend (8.1c) — то, что хранит эту связь.» Walkthrough = текст в thesis, не UI prototype.

2. **`[[planner-strategic-level]]`** — the 8.1c prompt is **spec-only**: deliverables + WHY + canonical references (§ 0 verbatim quotes of existing code stay — that's reference material) + structural shape descriptions (field lists, return shapes, invariants) + acceptance + decomposition. **No prescriptive new-code skeletons** in § 3. Executor writes the code; planner reviews output at close-out.

## Reference points для thesis-write (read at prompt-write time, don't pre-write code)

- `packages/contracts/src/entities/lms/schema-pairing/` — SchemaPairing contract slice (shipped Step 8.0b). Read for the entity shape + CRUD api schemas.
- `packages/api-server/prisma/schema.prisma` — `model SchemaPairing` (search lines) — FK shape, `relationKind` enum, both schema references.
- `packages/api-server/src/endpoints/lms/schema-row/admin.ts` + `schema/admin.ts` — Step 8.1b / 8.1a canonical api-server slice patterns (closest precedents — quote verbatim in § 0 as reference).
- `packages/api-server/src/authz/lms-guards.ts` — where `verifySchemaPairingOwnership` is appended. **REVIEW-I3 heads-up**: file at ~293/300 logical LOC — the append busts eslint `max-lines: 300`; executor will split `lms-guards.ts` further (tactical, no planner pre-work — just don't be surprised by the split scope at 8.1c close-out).
- D11 (`state/02-decisions.md`) — SchemaPairing UI deferral rationale.

## Key surface для thesis OQs

- **`relationKind` semantics** — what relation kinds exist (`ALTERNATING_SETS` + others?); coach use-case per `analysis/artifacts/` (cite verbatim per `[[coach-pov-first]]`).
- **Pairing scope** — are paired schemas constrained to the same Block? Same parent? Cross-block pairing legal? Trace from contract + Prisma FK.
- **`verifySchemaPairingOwnership` return shape** — mirror the ownership-chain guards; SchemaPairing references two schemas — ownership check resolves through which one (or both)?
- **Structural immutability on update** — can `relationKind` change post-create, or is pairing identity fixed (delete + recreate)? Hypothesis: mirror 8.1a/8.1b structural-immutable precedent.
- **Delete semantics** — pairing delete is just the link removal (schemas survive); confirm no cascade surprise.

## After Step 8.1c close-out

Server vertical complete. Per [01-step-queue.md](01-step-queue.md) execution order: 8.2 (HTTP routes) → 8.3 (client hooks) → 8.3.5 (read-embed) → 8.3.6 (SchemaRow @@unique) → 8.3.7-pre (WORKFLOW-001) → 8.3.7 (Schema partial-unique) → **8.4 anchor** (first coach-visible Schema editor) → **9.1..9.11** (SchemaRow editor) → **8.5..8.20** (archetype expansion) → 10. Next PR candidate accumulates 8.1c onto the branch (6 commits ahead post-8.1b).

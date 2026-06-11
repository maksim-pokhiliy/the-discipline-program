# 0041. Session-primitive model core — the box is a real `SchemaGroup` entity (supersedes 0040's derived parallelism)

- **Status:** Accepted (supersedes ADR-0040 — derived parallelism is replaced by explicit Group membership)
- **Date:** 2026-06-11
- **Deciders:** Maksim (owner), Claude (co-owner)
- **Tags:** `lms`, `plan-content`, `domain-model`, `api`, `yagni`

## Context

ADR-0040 made the "parallel block" a DERIVED concept: a schema was parallel iff it had ≥2 container children and neither `repetition` nor `arrangement` (`isStructurallyParallel(composition, { containerChildCount })`). Sub-schemas nested via `Schema.parentSchemaId` (a recursive Prisma self-relation); the composition carried an `arrangement` axis (`ordered | superset`) plus a top-level `interleaveOrder`; the atomic batch create was `POST …/schemas/parallel` (a parent schema + N ladder children).

The `session-primitive` initiative (founded 2026-06-10 from an owner-prompted domain-model review) found this — and the leaf model around it — to be parsing residue from ONE personal plan photographed into types: relations smeared across three mechanisms on three floors (derived parallel · stored superset rowId-pairs · fat in-row VOs), an 8-variant Weight with cardinality-1 members, 9 row kinds including a `wrapped` bracket flag. The June drains (ADR-0037..0040) cured the container level and stopped at the leaf and the relations.

The owner ratified the cure himself (`initiatives/session-primitive/decisions.md`, D-1..D-8 + D-MARKER-DEATH): a relation between siblings is membership in an explicit, persisted **Group** entity — ordered, contiguous members, an opaque coach-owned label the system never interprets, **no semantics derived from child count, no typed relation kinds, no recursion**. The arrangement axis dies whole; the ratified Grid A/B leaf kills land. The stored model becomes exactly the ratified skeleton:

```
Session → Block → [Group?] → Schema → Row        (fixed floors, NO recursion)
```

Wave 1 (PR #261, merged) re-skinned this into a box UX (`AccentGroupCard`, label = parent `header`, a «Group into one box» checkbox) **without touching the model** — box-ness was still keyed off the live `isStructurallyParallel` predicate. This ADR records Wave 2: the box becomes REAL. This is a one-way-door architecture change (the model reshapes, bridge-free, in a db:reset-only world with no migrations dir and a single coach), which is why it warrants an ADR and not just an initiative decision row.

## Decision

The box is a persisted `SchemaGroup` entity; parallelism is no longer derived — it is explicit Group membership. The coordinated changes (initiative DR-W2-1..9 + DR-W2-FORK-1..6):

- **`SchemaGroup` is a real entity** (`training_schema_groups`), block-owned (`onDelete: Cascade` from Block). Members link via `Schema.groupId` with `onDelete: SetNull` — deleting a group **dissolves** it, members survive in place as plain block schemas. The Group has **NO `order` column**: its position among block items is derived from `min(member.order)` — the one legitimate derivation (a render position from the membership relation itself, never box-ness/semantics from child count). It carries an opaque `label String?` (the system renders + carries it, never reads it) and an `interleaveOrder` validated `String` (display-only; `z.enum` at the contract boundary, not a Prisma enum).
- **Recursion dies.** `Schema.parentSchemaId`, the self-relation (both sides), and its two indexes are removed; `Schema` gains `groupId String?` + a `SetNull` FK + `@@index([groupId])`. Max structural depth = Block → Group → Schema → Row. The recursive `z.lazy` schemas (`schemaSchema`, `schemaWithBodySchema`, the compose container) become plain objects; `SchemaWithBody = { schema, rows }`.
- **The arrangement axis dies whole.** `arrangement`, `supersetPair`, top-level `interleaveOrder`, `ARRANGEMENT_AXIS_KINDS`, `isStructurallyParallel`, `CompositionStructure`, the `parallel`/`superset` label kinds, the compose-tree recursion, and the marker `superRefine` are deleted; `composition = { repetition?, rest? }`. The `repetition` 6-kind axis + `rest` are byte-compatible (sacred core).
- **The ratified leaf kills land** (Grid A/B RATIFIED/ACCEPTED rows only — the OPEN F-rows are red lines, untouched): reps (`implicit`/`total_flag`/`compound_rep_unit` die, `max → { tail? }`); load (`without_weight`/`unspecified` die, `byProfile {first, second}` added as the promoted m/f pair); weight (`dual_value` removed, all exotics stay); media (`{ url, label? }`); `RowKind` → `EXERCISE | REST | PLACEHOLDER | REST_SLOT`; the `compoundRep` column dies; compounds (`cyclical`/`sandwich` die, `compoundRowSchema` stays). The `INNER_LADDER_MARKER` row kind dies (D-MARKER-DEATH); the per-track-rep-scheme vs shared-round-counter distinction survives as two STRUCTURES (N one-row ladder-schemas in a Group vs one ladder-schema with N rows), not two fields.
- **The new atomic create is `POST …/groups`** (a `SchemaGroup` + N flat member schemas at contiguous block-tail orders, in one Serializable transaction with `retryOnP2034`) — **no parent schema is created**, the group + flat members ARE the structure. `PUT/DELETE …/groups/{id}` patch the label/interleave and dissolve. `POST …/schemas/parallel` is deleted.
- **Contiguity is a server invariant** (`assertGroupMembersContiguous`, on create / create-into-group / reorder); the read surface emits flat `schemas` (each with `groupId`) + a `groups: SchemaGroup[]` array per block; the subtree builders (`buildSchemaForest`/`buildSchemaSubtree`/`bucketByParent`) die.
- **The one-predicate is `buildBlockItems(schemas, groups)`** in `@repo/contracts` (the `schema-group` module) — the SOLE clustering source, replacing `isStructurallyParallel`. Platform render consumes it (one site) or `schema.groupId` directly; a hand-rolled cluster loop is forbidden.

**Scope boundary:** this covers the stored model, the group/create/reorder endpoints, guards, the read surface, the seed re-expression, and the platform round-trip parity (render + modal fork). It does **not** cover the W3 editor remap (DnD-grouping of existing schemas, ungroup UI, member-remove UI, the draft↔contract mapper collapse) — those are out. The OPEN F-row surfaces (weight exotics, tempo, position, sequence, `Block.timeCap`, `Schema.header` semantics, `or_alternative`, `perSetSubstitution*`, REST plaque carrier) are untouched JIT-frozen decisions.

## Consequences

- **Positive — one representation of a relation, on one floor.** A box is membership in one entity; there is no derived predicate to disagree with stored data (ADR-0040's CRITICAL came from a reader consulting a field instead of the shared predicate). The dangling-track-ref bug class, the arrangement back-patch machinery, and three `z.lazy` recursive type definitions are deleted. The diff is +4269/−12937 — mostly removal.
- **Positive — the model matches the ratified skeleton exactly.** Every floor has a designed affordance (the generic recursive tree editor is gone). Parallelism, rounds-over-a-block (Group label), and "then" (sibling order) each have one home.
- **Negative — `@@unique([blockId, order])` is consciously NOT added** (W2-ORDER-UNIQUE → W3). Today's order was never DB-enforced (the old unique keyed nullable `parentSchemaId`), so this is no regression — but order uniqueness stays a convention until W3's reorder rebuild. The reorder transaction keeps its plain (non-Serializable) two-phase negative-order dance verbatim.
- **Negative — idempotent retry is session-scoped.** The unchecked independent-ladders batch dedups an in-modal retry (stable key from `draft.id`) but a close+reopen mints a fresh batch BY DESIGN (across-session re-submit = new intent). The boundary is documented + pinned by a regression test; closing it fully (a key surviving modal remount) is a W3 carry-forward.
- **Negative — `interleaveOrder` integrity is contract-level, not DB-level.** A validated `String` (not a Prisma enum) means a corrupt direct DB write is theoretically possible; the zod boundary rejects it on write and the mapper rejects it on read (a parse error, like every Json column). Acceptable for a 2-value display toggle only the coach edits.
- **Neutral — the live DB must be reseeded.** The read mappers `.parse()` against the new contracts; any pre-W2 row shape (marker / footnote / standalone / `compoundRep` / `arrangement` / `dual_value`) fails the parse and 500s the week GET. `pnpm --filter @repo/api-server db:reset` + seed is the stale-data remedy (non-prod Neon, ADR-0019) and a hard prerequisite for the app to function — not just for the gated test suite.
- **Neutral — new code lives in new homes.** A `schema-group` contracts module (mirrors `schema-row`), a `schema-group` api-server endpoint module, `groups/` + `groups/[groupId]/` Next routes, `verifyGroupOwnership` in the lms guards. The Group label is opaque text the system never branches on — future readers must not special-case it (D-4).
- **Neutral — relation kinds stay untyped.** A specific relation gains typed semantics ONLY when a real engine (executor/scoring/analytics) reads it, designed fresh against that engine (the ADR-0038 re-introduce-fresh principle). "N rounds over a Group" is carried as label text (BACKLOG-ROUNDS) until a rounds-on-Group engine exists.

## Alternatives considered

1. **Keep parallelism derived (ADR-0040), just re-skin.** This was Wave 1 — it works as a UX but leaves the relation smeared across a derived predicate + recursion + a stored arrangement axis, and re-opens the one-predicate-disagrees-with-data hazard every time a reader is tempted to consult a field. Rejected by D-2/D-3: membership in an explicit entity is the single source.
2. **Group as a `Schema` subtype / structural-kind tile in the add-schema modal.** Rejected by D-3 (recursion in a hat + the picker-first smell ADR-0037 killed). The add-schema modal stays primitives-only; `add sub-schema` dies.
3. **Graph links between siblings.** Rejected by D-2 (violates the owner's own contiguity rule, is render-hostile, and re-opens the dangling-ref bug class ADR-0040/step-2 just buried).
4. **A typed relation-kind enum on the Group (`parallel|choice|superset`).** Rejected by D-4 — the owner's applicability-matrix counter: one field whose values have different validity domains per floor = per-level guards, refusal channels, inert variants (the exact disease the June drains removed). No engine reads relation semantics today (channel-3, not channel-2).
5. **A Prisma enum for `interleaveOrder`.** Rejected (DR-W2-FORK-1): couples a 2-value display toggle to a migration in a db:reset-only world; the zod boundary already gives the integrity.
6. **Compat shims / dual-read paths during the migration.** Rejected by house style (aggressive bridge-free): intermediate trees may be RED locally; only the final pushed state must be green. A feature flag would add a dead alternate path with no rollback audience (single coach).
7. **`@@unique([blockId, order])` now.** Rejected — forces a W3-class two-phase reorder rewrite; no regression without it (order was never DB-enforced).

## References

- ADR-0040 — derive parallelism from structure: the decision this ADR supersedes. `parallel` was a derived label over recursion + a stored arrangement axis; it is now explicit `SchemaGroup` membership.
- ADR-0037 / 0038 / 0039 — the inert-surface drain this continues; ADR-0038's re-introduce-fresh principle governs `byProfile`'s dropped resolver and the untyped relation kinds.
- ADR-0036 — default-on idempotency keys: the layer the W1-DUP-RETRY client threading rides (no new server work).
- ADR-0019 — non-prod Neon via `db:reset`/`db:push`, no `migrations/`; the reseed is the stale-data remedy.
- `initiatives/session-primitive/` — charter, D-1..D-8 + D-MARKER-DEATH + DR-W2-1..9 / DR-W2-FORK-1..6 (`decisions.md`), carry-forwards (`deferred.md`), the notation grid (`primitive-spec.md`); Wave 1 = PR #261.

# Next planner action

> Concrete next-action handoff brief. Updated every close-out as the queue shifts.

## Status: Step 8.1c CLOSED 2026-05-20

`SchemaPairing` → `AlternatingGroup` N-ary model redesign (D14) shipped — 5 commits `aec22f8a..cf14aab8` + close-out docs commit on `feat/training-domain` (local, unpushed). Definition layer only: Prisma + `@repo/contracts` slice + `analysis/` sync + seed. Review A / QA A, 1610/1610 tests, all gates green. Full entry: [../log/step-08.1c.md](../log/step-08.1c.md).

## Next planner action: Step 8.1d thesis cycle — `lmsAlternatingGroupApi`

The api-server slice against the `AlternatingGroup` shape Step 8.1c established. Deliverables: `lmsAlternatingGroupApi` (`create` / `addMember` / `removeMember` / `delete`) + `verifyAlternatingGroupOwnership` guard + `mapToAlternatingGroup` mapper + the `addMember` / `removeMember` contract request schemas (8.1c shipped only entity + create + delete + list contracts). `/feature` full (guard + mapper + 4 endpoints + group-lifecycle invariants — heavier than the cancelled thin 8.1c).

**The `AlternatingGroup` shape (from Step 8.1c — read verbatim at prompt-write):**

- Prisma `model AlternatingGroup { id, blockId, relationKind, createdAt, updatedAt }`; `block` relation `onDelete: Cascade`; `schemas Schema[]` back-relation. Membership = `Schema.alternatingGroupId String?` (`onDelete: SetNull`).
- Contract slice `packages/contracts/src/entities/lms/alternating-group/`: `alternatingGroupSchema { id, blockId, relationKind, schemaIds: cuid[].min(2), createdAt, updatedAt }`; `createAlternatingGroupSchema { relationKind, schemaIds: cuid[].min(2) + unique-refine }`; api schemas = get / create-request / create-response / delete-params. No `addMember`/`removeMember` schemas yet — 8.1d adds them.

**Thesis OQ surface (group lifecycle — all api logic, 8.1d's to ratify):**

- **`create`** — bulk: `{ relationKind, schemaIds: 2..N }`; server derives `blockId` from the member schemas; **same-Block invariant** across all members; in-tx re-check (TOCTOU); Serializable + `retryOnP2034` (mirror `lmsSchemaRowApi.create`).
- **`addMember` / `removeMember`** — operation contract schemas defined here. `removeMember` (and a member-schema delete) dropping the group below 2 members → **dissolve-vs-reject** decision (D-A1 / C-A1 explicitly left this to 8.1d).
- **Archetype homogeneity** — must group members all be `alternating-sets` archetype? `setEnumeration` tiling validation across members? Cite `analysis/` per `[[coach-pov-first]]`.
- **`verifyAlternatingGroupOwnership`** — resolves through the group's `block` chain; consumed by `delete`/`addMember`/`removeMember` (`create` verifies member schemas via `verifySchemaOwnership`).
- **`mapToAlternatingGroup`** — materialises `schemaIds` from the `schemas` relation (`include`/`select` — `AlternatingGroup` does not store member ids as a column).

**Carry-forwards into the 8.1d thesis:**

- **QA-004** (Stage-6 INFO) — `schemaIds` has no `.max()` cap. Intentional per D14 ("2..N, no cap"); 8.1c is definition-only so no DoS surface. At 8.1d, when `createAlternatingGroupRequestSchema` becomes a real HTTP body parser, decide: a sane practical ceiling at the edge, OR rely on the same-Block check naturally bounding it (a group cannot exceed the block's schema count).
- **QA-005** (Stage-6 INFO) — entity `alternatingGroupSchema.schemaIds` accepts duplicates (only `createAlternatingGroupSchema` carries the unique-refine — mirrors the deleted slice's idiom). If `mapToAlternatingGroup` assembles `schemaIds` with any non-trivial logic, add a mirror uniqueness `.refine` on the entity schema + a test.
- **REVIEW-I3** — `lms-guards.ts` at ~293/300 logical LOC; appending `verifyAlternatingGroupOwnership` trips eslint `max-lines: 300`. Executor splits `lms-guards.ts` tactically — no planner pre-work, non-surprising scope note for the 8.1d close-out.
- **D-A2** — contract `Schema.alternatingGroupId` exposure + `mapToSchema` change — deferred to a future read-embed step, NOT 8.1d.

**Reference points to read at 8.1d prompt-write time:**

- `packages/contracts/src/entities/lms/alternating-group/` — the contract slice (entity + create/api schemas).
- `packages/api-server/prisma/schema.prisma` — `model AlternatingGroup` + `Schema.alternatingGroupId`.
- `packages/api-server/src/endpoints/lms/schema-row/admin.ts` + `schema/admin.ts` — canonical api-server slice precedents (8.1b / 8.1a) for § 0 verbatim quotes.
- `packages/api-server/src/authz/lms-guards.ts` + `mappers/lms/` — where the guard + mapper land.

## Process reminders (active from Step 8.1c)

- Thesis = two voice-coded sections (coach view + developer view) per `[[thesis-format]]`; coach view carries the mandatory 1-paragraph walkthrough per `[[coach-walkthrough-gate]]`.
- Prompt is spec-only per `[[planner-strategic-level]]` — § 0 verbatim quotes of existing code stay; no prescriptive new-code skeletons in § 3.
- `/feature` wrapper, `feat/training-domain` long-lived branch, no branch cut.

## After Step 8.1d close-out

Server vertical complete. Per [01-step-queue.md](01-step-queue.md) execution order: 8.1d → 8.2 (HTTP routes) → 8.3 (client hooks) → 8.3.5 (read-embed) → 8.3.6 (SchemaRow `@@unique`) → 8.3.7 (Schema partial-unique) → **8.4 anchor** → **9.1..9.11** → **8.5..8.20** → 10. (8.3.7-pre dropped — WORKFLOW-001 resolved by 8.1c.)

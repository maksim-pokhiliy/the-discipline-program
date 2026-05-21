# Step 8.3.6 — `SchemaRow @@unique([schemaId, order])` composite-uniqueness constraint

**Wrapper**: `/feature small`. A single-package additive Prisma constraint — `@@unique([schemaId, order])` on the `SchemaRow` model, an `analysis/` sync, one regression test, a `db:reset` + `db:seed`. No new endpoint, no business logic, no UI, no contract change. The structural mirror of Step 7.3.6 (Block `@@unique([sessionId, order])`). Step 7.3.6 ran `/feature small`; 8.3.6 is the same kind, narrower (no reorder rewrite — see D-8.3.6-3) → `/feature small`.

**Branch**: `feat/training-domain` long-lived. **NO new branch cut** (per `[[training-domain-workflow]]` + `[[always-via-feature-skill]]` — the `/feature` skill's default `feat/<slug>` cut is overridden; stay on `feat/training-domain`). At prompt-write the branch is at `88e76863` (5 commits ahead of `main` `e48c2b33`); the prompt commit (`docs(step-08.3.6): …`) makes it 6 — **use that prompt commit as the `git diff` baseline**.

**Predecessor / decomposition**: Steps 8.0b → 8.1a → 8.1b → 8.1c → 8.1d → 8.2 → 8.3 → 8.3.5 shipped the `Schema` / `SchemaRow` / `AlternatingGroup` slices end-to-end — write path (contracts → api-server → routes → client hooks) and read path (the `schemas[]` / `alternatingGroups[]` embed into the week response). 8.3.6 hardens one latent DB surface: `SchemaRow` carries `@@index([schemaId, order])` but **no `@@unique`** — two rows in one schema can hold the same `order` under a concurrent write, silently. 8.3.6 adds the constraint. It is the mirror of Step 7.3.6 (which closed the same surface for `Block`), and a pre-Step-8.4 cleanup: the constraint lands before the Step 8.4 schema editor drives concurrent SchemaRow writes. Thesis ratified in the planner-user chat 2026-05-21 (two-voice; the user confirmed all OQs — see § 1.x).

This step ships **no UI** and **no contract change**. `@@unique` is type-system-neutral — the generated Prisma client type shape (`Prisma.SchemaRowCreateInput`, `Prisma.SchemaRowInclude`, …) does not change; nothing downstream re-types. No browser smoke-test (§ 9): there is no runtime UI surface.

---

## § 0 — Verbatim source reads (read-at-prompt-write-time per `[[planner-verbatim-registration]]` + `[[scope-via-existing-patterns]]`)

All quotes are the **current** state, verified 2026-05-21 at HEAD `88e76863`. Reference material — the deliverable is described structurally in § 3, not as code skeletons (per `[[planner-strategic-level]]`). **Before executing § 3, re-Read each cited path and confirm a byte-for-byte match.** Any drift → STOP, surface via `AskUserQuestion` with the diff + a hypothesis. Do not silently adapt.

### § 0.1 — The canonical precedent: Step 7.3.6 (Block `@@unique([sessionId, order])`)

Step 7.3.6 added `@@unique([sessionId, order])` to the `Block` model — the exact pattern 8.3.6 mirrors for `SchemaRow`. Its prompt is `implementation/step-07.3.6/prompt.md`; its archive entry is `implementation/log/_archive-pre-refactor.md` (search `## Step 07.3.6`). What 7.3.6 did: a one-line Prisma edit + an analysis sync (3 files) + 2 test cases + a `db:reset`/`db:seed` + one atomic commit (`85866ba1`).

**The flavour-(h) `[[planner-mutation-invariant-trace]]` anti-precedent — read this carefully.** Step 7.3.6's § 5 adversarial pass (axis 3) explicitly stated _"no constraint violation possible (всі orders distinct by construction)"_ for the reorder operation. That was **wrong**: a Postgres unique constraint fires immediately on every row UPDATE (not `DEFERRABLE` by default), so a single-pass swap reorder (`[A=10,B=20]` → `[B=10,A=20]`) collides on the _first_ UPDATE — an intermediate-state P2002, even though the final state is valid. Step 7.3.6's executor hit this mid-execution in the reorder happy-path test, escalated via `AskUserQuestion`, and the `lmsBlockApi.reorder` rewrite to the two-pass shift-to-negative pattern became an execution-time scope expansion. **8.3.6 does that trace upfront** — § 5 axis 3 below — and the verdict is the _inverse_ of what the handoff brief assumed: see § 0.4 + D-8.3.6-3.

### § 0.2 — The live `SchemaRow` model (`packages/api-server/prisma/schema.prisma:731-755`, verbatim)

```prisma
model SchemaRow {
  id          String    @id @default(cuid())
  schemaId    String
  order       Int
  rowKind     RowKind
  rowPayload  Json
  load        Json?
  reps        Json?
  side        Json?
  tempo       Json?
  position    Position?
  sequence    Json?
  intensity   Json?
  media       Json?
  compoundRep Json?
  notes       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  schema                     Schema                      @relation(fields: [schemaId], references: [id], onDelete: Cascade)
  performedExerciseInstances PerformedExerciseInstance[]

  @@index([schemaId, order])
  @@map("training_schema_rows")
}
```

**Insertion point**: a new `  @@unique([schemaId, order])` line **immediately before** `  @@index([schemaId, order])`. Both lines are retained. This is the live canonical pattern — `Block` (schema.prisma:667-668), `Week` (608-609 region), `Day` (626 region) all carry `@@unique(...)` directly before the matching `@@index(...)`:

```prisma
  @@unique([sessionId, order])
  @@index([sessionId, order])
  @@map("training_blocks")
```

(`Block`, verbatim — schema.prisma:667-669.) Postgres creates a unique index implicitly for `@@unique`, making the explicit `@@index` redundant from a query-planner standpoint — Prisma generates a separate `SchemaRow_schemaId_order_key` (unique) and `SchemaRow_schemaId_order_idx` (plain). **DO NOT drop the explicit `@@index`** — keeping both mirrors `Block`/`Week`/`Day`; dropping it is an unrelated cleanup, out of scope (Step 7.3.6 made the same call).

### § 0.3 — The analysis-mirror `SchemaRow` model (`analysis/artifacts/06-formalization/schema.prisma:267-290`, verbatim)

```prisma
model SchemaRow {
  id          String    @id @default(cuid())
  schemaId    String
  order       Int
  rowKind     RowKind
  rowPayload  Json
  load        Json?
  reps        Json?
  side        Json?
  tempo       Json?
  position    Position?
  sequence    Json?
  intensity   Json?
  media       Json?
  compoundRep Json?
  notes       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  schema                     Schema                      @relation(fields: [schemaId], references: [id], onDelete: Cascade)
  performedExerciseInstances PerformedExerciseInstance[]

  @@index([schemaId, order])
}
```

Identical to the live model **except no `@@map`** (the analysis spec is pre-port — `@@map` is a port-layer concern; all analysis models omit it). Same single-line insert — `@@unique([schemaId, order])` before `@@index([schemaId, order])`.

### § 0.4 — `lmsSchemaRowApi.reorder` — ALREADY two-pass (`schema-row/admin.ts:190-246`, verbatim — load-bearing)

```ts
  reorder: async (
    userId: string,
    planId: string,
    schemaId: string,
    data: ReorderSchemaRowsData,
  ): Promise<SchemaRow[]> => {
    const owner = await verifySchemaOwnership(schemaId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Schema not found in plan", { planId, schemaId });
    }

    verifyPlanEditable(owner);

    const rows = await prisma.schemaRow.findMany({
      where: { id: { in: [...data.orderedIds] } },
      select: { id: true, schemaId: true },
    });

    if (rows.length !== data.orderedIds.length) {
      throw new BadRequestError("Some orderedIds reference non-existent rows", {
        missing: data.orderedIds.filter((id) => !rows.some((r) => r.id === id)),
      });
    }

    const foreignIds = rows.filter((r) => r.schemaId !== schemaId);

    if (foreignIds.length > 0) {
      throw new BadRequestError("Some orderedIds do not belong to the target schema", {
        foreignIds: foreignIds.map((r) => r.id),
      });
    }

    const scopeCount = await prisma.schemaRow.count({ where: { schemaId } });

    if (data.orderedIds.length !== scopeCount) {
      throw new BadRequestError("orderedIds must include every row in the target schema", {
        provided: data.orderedIds.length,
        expected: scopeCount,
      });
    }

    try {
      const updated = await prisma.$transaction([
        ...data.orderedIds.map((id, i) =>
          prisma.schemaRow.update({ where: { id }, data: { order: -(i + 1) } }),
        ),
        ...data.orderedIds.map((id, i) =>
          prisma.schemaRow.update({ where: { id }, data: { order: (i + 1) * 10 } }),
        ),
      ]);

      return updated.slice(data.orderedIds.length).map(mapToSchemaRow);
    } catch (error) {
      return handlePrismaError(error, { entity: "SchemaRow" });
    }
  },
```

**Load-bearing fact.** `lmsSchemaRowApi.reorder` was shipped in Step 8.1b (`git blame` → commit `e1091719` _"add lmsschemarowapi with crud and two-pass reorder"_) **already in the canonical two-pass shift-to-negative form**. The `$transaction([...])` array holds Phase 1 (every row → `order: -(i+1)`, i.e. `-1, -2, …, -N`) followed by Phase 2 (every row → `order: (i+1)*10`, i.e. `10, 20, …, N*10`). Prisma executes the array sequentially in one transaction. No intermediate UPDATE ever holds a colliding `order` (negatives in Phase 1 are pairwise distinct and never collide with the positive pre-reorder orders; positives in Phase 2 are pairwise distinct and never collide with the remaining negatives). **The constraint is compatible with this method with zero changes** — see § 5 axis 3 for the full intra-tx trace. The `04-next-action.md` handoff brief assumed a single-pass reorder needing a rewrite; the verbatim read above corrects that. **`schema-row/admin.ts` is NOT in 8.3.6's scope** (D-8.3.6-3).

`lmsSchemaRowApi.create` (`schema-row/admin.ts:46-113`, abbreviated) — the relevant shape: the create runs `retryOnP2034(() => prisma.$transaction(async (tx) => { … const max = await tx.schemaRow.aggregate({ where: { schemaId }, _max: { order: true } }); const nextOrder = (max._max.order ?? 0) + 10; return tx.schemaRow.create({ data: { schemaId, order: nextOrder, … } }); }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }))`. The `_max(order) + 10` read + the `Serializable` isolation + the `retryOnP2034` wrap are the existing concurrency protection (§ 5 axis 2). 8.3.6 does **not** touch `create` either.

### § 0.5 — `er-final.md` § 5 cross-cutting invariants (`analysis/artifacts/06-formalization/er-final.md:368-384`, verbatim — target locus)

```markdown
## §5. Cross-cutting invariants (post Phase 5 ratify)

1. **Bodyweight equipment ↔ Load.kind**: …
   …
2. **Order semantics** (Q6): sparse integers, default 10/20/30 increments. Gaps allowed.
3. **BlockLabelAssignment** unique `(blockId, labelId)`: set semantics (no dups), ordered list (presentation).
4. **PerformedSession** unique `(sessionId, userId)`: latest-only (Q9). Re-do = new Session. Per D2 (2026-05-12), `userId` references `User` (external).
5. **Week** unique `(planId, startDate)`: один Week per ISO-week per Plan (D1, 2026-05-12). Day unique `(weekId, dayOfWeek)`: ≤7 Days per Week, индексированы перечислением, не sparse integer.
6. **Block** unique `(sessionId, order)`: composite uniqueness — sparse-int positional ordering (#7), no duplicates within session. Engineering enforcement to prevent silent corruption under concurrent create/reorder races (Step 7.3.6 — closes Step 7.1 QA-001 pre-Step-8 surface).

---

## §6. Rendering
```

**Insertion point**: a new invariant **#12** immediately after #11, before the `---` separator. Mirror the #11 wording. § 4 cardinality matrix — **NO edit** (uniqueness lives in § 5 per the #8/#10/#11 convention; the matrix carries cardinality + ordering semantics only — Step 7.3.6 made the same call).

### § 0.6 — `implementation-notes.md` § 4 structure (`analysis/artifacts/06-formalization/implementation-notes.md:1331-1369`, target locus)

`## §4. Migration considerations` has subsections §4.1 … §4.10. The relevant tail: §4.7 (Step 7.3.6 — Block constraint), §4.8 (Step 8.0b), §4.9 (Step 8.1c), §4.10 (Step 8.1d — ends at line ~1365), then `---` (1367), then `## §5. Open items / future work` (1369).

§4.7 is the structural model for the new entry — verbatim:

```markdown
### §4.7 Step 7.3.6 — Block (sessionId, order) composite uniqueness constraint

Added 2026-05-18 per Step 7.3.6 (closes Step 7.1 Stage 6 QA-001 carry-forward). Prisma `@@unique([sessionId, order])` on Block model enforces composite uniqueness at the DB layer. Pre-existing `lmsBlockApi.create` flow (`_max(order) + 10` inside `Serializable` transaction wrapped in `retryOnP2034`) was previously protected only by Postgres SSI false-positive detection — under SSI predicate-lock granularity edge cases, concurrent creates on the same session could silently insert duplicate `(sessionId, order)` rows. …
```

**Insertion point**: a new `### §4.11 Step 8.3.6 — SchemaRow (schemaId, order) composite uniqueness constraint` immediately after §4.10's closing paragraph and before the `---` / `## §5. Open items` heading. § 3 Phase 2c gives the verbatim text — note its second half explicitly records the reorder _non_-change (the contrast with §4.7).

### § 0.7 — `db:reset` / `db:seed` + seed has zero SchemaRow inserts

`packages/api-server/package.json` scripts: `db:reset` = `prisma db push --force-reset && tsx scripts/apply-sql-checks.ts` — recreates the schema with the new `@@unique`; it does **NOT** auto-seed. `db:seed` = `prisma db seed` — must be run explicitly after. Per ADR-0019 + `[[discipline-db-non-prod]]` — Neon dev, no migration history, safe drop-recreate; ensure `DATABASE_URL` is the direct non-pooler URL per `[[neon-dev-direct-url]]`.

**Seed has zero SchemaRow inserts** (regression check, verified at prompt-write — `grep -rn "schemaRow" packages/api-server/prisma/seed*` finds only a JSON-Schema string literal in `seed/archetypes/rounds-ladder.ts`, no `.create`). `prisma/seed/training-plans.ts` creates 4 `TrainingPlan` rows and nothing below them (no weeks / days / sessions / blocks / schemas / rows). → `db:reset` + `db:seed` produces zero `SchemaRow` rows; the new constraint cannot conflict at seed time. No seed edit (mirror Step 7.3.6 § 0.10 — "Seed has zero Block inserts").

`packages/api-server/prisma/sql/lms-checks.sql` (the only file `apply-sql-checks.ts` runs) — verified zero `SchemaRow` / `training_schema_rows` entries. The `@@unique` ships via the Prisma DSL, not SQL; `lms-checks.sql` is reserved for what Prisma cannot express (partial unique with `WHERE`, named `CHECK`). **DO NOT add a SQL constraint here** — that is Step 8.3.7's surface (the Schema partial-unique), not 8.3.6's.

### § 0.8 — The test surface (`packages/api-server/src/endpoints/lms/schema-row/admin.test.ts`, structural)

The file: `describe("lmsSchemaRowApi")` with nested `describe` blocks — `create` (15 cases), `update` (6), `delete` (2), `reorder` (5), `cross-cutting` (4). Helpers in the `describe` closure:

- `provisionBlock(options)` (`:35-79`) — creates a unique week (`weekCounter` increments) → day → session → block; returns `{ week, day, session, block, cleanup }`.
- `provisionSchema(options)` (`:81-109`) — calls `provisionBlock`, then `cleanupRaw.schema.create({ data: { blockId, parentSchemaId: null, order: 10, kind, archetypeId, archetypeParams } })`; returns `{ ...blockCtx, schema }`. `cleanup` (inherited from `provisionBlock`) deletes the schema's rows → schema → block → … → week.
- `cleanupRaw` — imported from `../../../test/helpers`; the un-guarded Prisma client for direct fixture inserts.

Two existing cases the constraint touches — both must be re-run **unmodified** and verified green (Phase 4b):

- `reorder > "renumbers three rows on the happy path"` (`:771-814`) — creates 3 rows (orders 10/20/30 via the API's `_max+10`), calls `reorder` with `orderedIds: [c, a, b]` (a full permutation), asserts the stored orders are `c=10, a=20, b=30`. This already exercises a swap-class reorder — under a single-pass reorder it would fail intermediate-state P2002; it passes because the method is two-pass (§ 0.4). It stays green under `@@unique`.
- `cross-cutting > "concurrent create on same schemaId — at least one succeeds via P2034 retry"` (`:919-954`) — `Promise.allSettled` of two concurrent `lmsSchemaRowApi.create` on one schema; asserts `fulfilledCount >= 1`, `stored.toHaveLength(fulfilledCount)`, and _conditionally_ (`if (fulfilledCount === 2)`) orders 10/20. The assertions are defensive — the test stays green whether the loser retries (P2034 path, `fulfilledCount=2`) or fails fast (P2002 path post-constraint, `fulfilledCount=1`). See § 5 axis 2.

`packages/api-server/src/utils/retry-on-p2034.test.ts` exists — the `retryOnP2034` helper has its own dedicated test. (Relevant to D-8.3.6-4 — why no helper-passthrough test is duplicated into `admin.test.ts`.)

### § 0.9 — Husky / turbo / commitlint (verbatim)

- `.husky/pre-commit`: `node scripts/check-secrets.mjs` → `npx lint-staged` → `SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"`.
- `.husky/pre-push`: `pnpm dep:check` → `SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"`.
- `turbo.json`: `check-types` / `lint` `dependsOn: ["^…"]`; `test: { cache: false }`.
- Commitlint: subject ≤ 100 chars, fully lowercase (no caps anywhere, incl. acronyms — `schemarow`, `api-server`); body lines ≤ 150 (a safety margin of ≤ 140 for `-m`; em-dashes near the 100-char mark can trip a body/footer split — short `-m` paragraphs are safe).

**Fan-out → single atomic commit (no squash).** 8.3.6 touches `packages/api-server/` (`prisma/schema.prisma` + `schema-row/admin.test.ts`) and `analysis/` (not a code package — no `check-types` impact). `@@unique` is type-system-neutral: the generated Prisma client type shape does not change, so no downstream package re-types and there is no broken intermediate tree. A cross-package squash is **not** required. One atomic commit is preferred for schema-change revertability (mirror Step 7.3.6 `85866ba1`). See § 6.

### § 0.A — Consumer / grep enumeration (mandatory pre-execution, per `[[planner-consumer-pattern-read]]`)

Before the Phase 1 schema edit, run each grep and confirm the expected zero-impact. Any unexpected hit → STOP, surface via `AskUserQuestion` with the diff + a hypothesis.

```bash
# 1. Prisma client callsites on SchemaRow — none must insert/update a duplicate (schemaId, order)
grep -rn "prisma\.schemaRow\|tx\.schemaRow\|cleanupRaw\.schemaRow" packages/api-server/src/
# Expected: lmsSchemaRowApi (admin.ts — create/update/delete/reorder), the week/day read includes,
# test fixtures. create uses _max+10; update never writes `order`; reorder is two-pass (§ 0.4);
# delete frees a slot. No callsite produces a duplicate (schemaId, order).

# 2. SchemaRow @@unique / @@index in the live schema
grep -nE "@@unique|@@index" packages/api-server/prisma/schema.prisma | grep -i "schemaId\|schema_row"
# Expected: @@index([schemaId, order]) on SchemaRow only. The new @@unique does not conflict.

# 3. Seed SchemaRow inserts (zero-check)
grep -rn "schemaRow" packages/api-server/prisma/seed.ts packages/api-server/prisma/seed/
# Expected: only the JSON-Schema string literal in seed/archetypes/rounds-ladder.ts. No `.create`.

# 4. Test fixture SchemaRow inserts (sanity — no duplicate (schemaId, order) per test)
grep -rn "cleanupRaw\.schemaRow\.create\|schemaRow.*order:" \
  packages/api-server/src/endpoints/lms/schema-row/admin.test.ts
# Expected: each test calls provisionSchema() for a fresh schema; rows are created via the API
# (_max+10 → sparse 10/20/30) — no duplicate (schemaId, order) within a schema.
```

### § 0.B — `db:reset` index verification (optional executor sanity)

After `db:reset`, the executor may confirm the unique index exists: `psql "$DATABASE_URL" -c "\d training_schema_rows"` — the index list should include `SchemaRow_schemaId_order_key` (UNIQUE) + `SchemaRow_schemaId_order_idx` (plain). Optional — not required for step completion.

---

## § 1 — Goal & ratified decisions

### Coach view

**Walkthrough.** Денис открывает план в редакторе, листает к нужной неделе и заходит внутрь блока тренировки, где видит схему с её строками — упражнения, отдых, пометки — выстроенными в заданном порядке. Он перетаскивает строку вверх-вниз или добавляет новую — список строк тут же перестраивается на экране. Результат, который этот шаг обслуживает: даже если тот же план открыт параллельно во второй вкладке или на другом устройстве и обе стороны двигают строки одной схемы — после перезагрузки список остаётся целостным: каждая строка стоит на одной чёткой позиции, ни одна не задвоена и ни одна не «проваливается» под соседнюю. Тренер всегда видит однозначный порядок строк, а не смазанную картину из конкурирующих правок.

**Goal (coach).** На самом шаге 8.3.6 тренер не увидит ничего нового — это невидимая прослойка надёжности. Она гарантирует, что порядок строк внутри схемы всегда однозначен: две строки одной схемы физически не могут занять одну позицию. Видимым этот фундамент станет на Step 8.4, когда появится сам редактор схем — но без него редактор мог бы при неудачном стечении параллельных правок показать «призрачную» строку или потерять позицию.

При одновременной правке порядка строк из двух сессий побеждает последняя запись — список после перезагрузки консистентен, но тренеру не приходит уведомления о том, что его правку перетёрли. Для MVP это сознательно принято (OQ-C1, ратифицировано): сигнал о конфликте параллельного редактирования — отдельная UX-тема (codebase-wide carry-forward QA-B5), вне scope воркфлоу; 8.3.6 закрывает только целостность данных.

### Developer view

**Goal.** Add `@@unique([schemaId, order])` to the `SchemaRow` Prisma model — DB-level enforcement of the positional-uniqueness invariant, the structural mirror of Step 7.3.6's `Block @@unique([sessionId, order])`. The constraint is engineering enforcement of the existing sparse-int ordering invariant (`er-final.md` § 5 #7), **not** a new domain semantic. Sync `analysis/` (3 files), add one regression test (the P2002 floor), `db:reset` + `db:seed`, one atomic commit.

### § 1.x — Ratified decisions (planner-user chat 2026-05-21)

- **D-8.3.6-1 (one step, `/feature small`).** A single-package additive constraint + analysis sync + 1 test + `db:reset`. Step 7.3.6 (the structural mirror) ran `/feature small`; 8.3.6 is the same kind, narrower (no reorder rewrite) → `/feature small`.
- **D-8.3.6-2 (`@@unique` placement).** `@@unique([schemaId, order])` is added **immediately before** the existing `@@index([schemaId, order])` on `SchemaRow`; both lines retained. The live `Block`/`Week`/`Day` canonical pattern (§ 0.2). Prisma generates a separate unique index + the plain index; the explicit `@@index` stays for sibling consistency. Applied identically to the live `schema.prisma` and the `analysis/` mirror (the mirror has no `@@map`).
- **D-8.3.6-3 (`lmsSchemaRowApi.reorder` is NOT rewritten — load-bearing).** `lmsSchemaRowApi.reorder` was shipped in Step 8.1b (`e1091719`) **already in the canonical two-pass shift-to-negative form** (§ 0.4). The intra-transaction trace (§ 5 axis 3) confirms it is compatible with `@@unique([schemaId, order])` with **zero changes** — every intermediate UPDATE holds a pairwise-distinct `order`, no collision. `schema-row/admin.ts` is **out of scope** — the file is not touched. This corrects the `04-next-action.md` handoff brief, which assumed a single-pass reorder needing a rewrite (the brief mirrored Step 7.3.6's _outcome_ — a reorder rewrite — without accounting for the Step 8.1b executor having already internalized the flavour-(h) lesson). 8.3.6 does the flavour-(h) trace upfront, exactly to avoid repeating the 7.3.6 anti-precedent — and the upfront trace's verdict is "no rewrite needed".
- **D-8.3.6-4 (one new test — the P2002 floor; no helper-passthrough test).** One new test case is added: a direct P2002-floor case — raw-create two `SchemaRow` rows at the same `(schemaId, order)`, assert the second rejects `P2002` (mirror Step 7.3.6's case 10). Step 7.3.6 added a _second_ test — a `retryOnP2034`-passthrough timing case (`elapsed < 50ms`) — which 8.3.6 deliberately does **not** mirror: (i) it tests the `retryOnP2034` helper, not the new constraint, and the helper already has its own `retry-on-p2034.test.ts` (§ 0.8); (ii) the `elapsed < 50ms` timing-proxy form is exactly the QA-023 flake pattern (`block/admin.test.ts:406`, 1/3 runs fail at 68ms) — re-creating it for `SchemaRow` would re-create the flake, an anti-pattern per `[[no-tech-debt-in-mocks]]`; (iii) the existing `concurrent create … P2034 retry` case (`:919`) already covers the concurrent path. The existing `reorder` happy-path (`:771`) and `concurrent create` (`:919`) cases are re-run **unmodified** as regression checks (Phase 4b).
- **D-8.3.6-5 (carry-forwards NOT folded).** **QA-001c** — post-`@@unique`, a concurrent-create loser may surface an immediate `P2002` instead of a `P2034` retry (`retryOnP2034` filters strictly on `P2034`); this is a known codebase-wide carry-forward (`03-deferred.md` "Pre-Step-8 cleanup"), the same one Step 7.3.6 created for `Block`. 8.3.6 mirrors 7.3.6's scope and does **not** fold it in. **QA-W2** — `lmsSchemaRowApi.reorder`'s array-form `$transaction` cannot embed a `plan.deletedAt` re-check; since 8.3.6 does not touch `admin.ts` at all (D-8.3.6-3), QA-W2 is not even re-touched — it stays in the QA-W1/W2 `/fix` bundle. Neither is in scope.
- **D-8.3.6-6 (`analysis/` sync — 3 files).** Per WORKFLOW.md `analysis/` rules, a Prisma schema change syncs in the same session: `06-formalization/schema.prisma` (the `@@unique` mirror), `er-final.md` § 5 (new invariant #12), `implementation-notes.md` § 4 (new §4.11 record). `05-synthesis/domain-model.md` is **untouched** — entity semantics are unchanged (`SchemaRow` is already conceptually unique-per-position via sparse-int ordering; the constraint is engineering enforcement). `stress-test.md` / `stress-final.md` are **untouched** — no new edge case drove this (it is a latent regression surface, not a stress case). Mirror Step 7.3.6's analysis-sync scope exactly.
- **D-8.3.6-7 (single atomic commit).** Single-package code scope (`@repo/api-server`) + analysis (not a code package); `@@unique` is type-system-neutral → no cross-package fan-out, no broken intermediate tree, no squash needed (§ 0.9). One atomic commit covering schema + analysis sync + test, preferred for schema-change revertability. Mirror Step 7.3.6 `85866ba1`.

---

## § 2 — Scope / Inputs

### Files MODIFIED (5)

- `packages/api-server/prisma/schema.prisma` — add `@@unique([schemaId, order])` to the `SchemaRow` model, immediately before `@@index([schemaId, order])` (§ 0.2).
- `analysis/artifacts/06-formalization/schema.prisma` — the identical addition on the `SchemaRow` mirror model (no `@@map` — § 0.3).
- `analysis/artifacts/06-formalization/er-final.md` — § 5: new cross-cutting invariant #12 after #11 (§ 3 Phase 2b).
- `analysis/artifacts/06-formalization/implementation-notes.md` — § 4: new §4.11 record after §4.10 (§ 3 Phase 2c).
- `packages/api-server/src/endpoints/lms/schema-row/admin.test.ts` — one new test case (the P2002 floor — § 3 Phase 4a).

### Files / areas NOT touched (out of scope)

- `packages/api-server/src/endpoints/lms/schema-row/admin.ts` — `reorder` is already two-pass; `create` / `update` / `delete` need no change (D-8.3.6-3, § 5 axes 2-5). The file is byte-identical.
- The seed (`prisma/seed*`) — zero `SchemaRow` inserts; `db:reset`+`db:seed` is clean (§ 0.7). No edit.
- `prisma/sql/lms-checks.sql` — `@@unique` ships via the Prisma DSL; zero `SchemaRow` entries today; the SQL file is Step 8.3.7's surface, not this one. No edit.
- `@repo/contracts`, the mappers, the route handlers, `apps/*` — `@@unique` is type-system-neutral; nothing re-types. No edit.
- `05-synthesis/domain-model.md`, `stress-test.md`, `stress-final.md`, `er-final.md` § 4 cardinality matrix — no domain-semantics change, no new stress case (D-8.3.6-6).
- The QA-001c / QA-W1 / QA-W2 carry-forwards — a separate `/fix` bundle (D-8.3.6-5).

---

## § 3 — Phases (spec-only — structural descriptions, no code skeletons)

No code comments (project rule). All five files land in **one atomic commit** (§ 6) — the "phases" are the executor's logical order.

### Phase 1 — the live Prisma schema

Add `  @@unique([schemaId, order])` to the `SchemaRow` model in `packages/api-server/prisma/schema.prisma`, on its own line immediately before `  @@index([schemaId, order])`. Both lines retained; the `@@map` line stays last. Mirror the live `Block` form (§ 0.2). `pnpm --filter @repo/api-server db:generate` regenerates the client (the executor may rely on `db:reset` in Phase 3 to do this).

### Phase 2 — `analysis/` sync (3 files, per WORKFLOW.md `analysis/` rules)

**Phase 2a** — `analysis/artifacts/06-formalization/schema.prisma`: the identical `@@unique([schemaId, order])` addition on the `SchemaRow` mirror model, before `@@index([schemaId, order])`. No `@@map` (§ 0.3).

**Phase 2b** — `analysis/artifacts/06-formalization/er-final.md` § 5: append a new invariant #12 immediately after #11, before the `---` separator. Verbatim:

```markdown
12. **SchemaRow** unique `(schemaId, order)`: composite uniqueness — sparse-int positional ordering (#7), no duplicates within schema. Engineering enforcement to prevent silent corruption under concurrent create/reorder races (Step 8.3.6 — mirrors #11; hardens the SchemaRow row-order surface before the Step 8.4 schema editor drives concurrent row writes).
```

§ 4 cardinality matrix — no edit (uniqueness lives in § 5 per the #8/#10/#11 convention).

**Phase 2c** — `analysis/artifacts/06-formalization/implementation-notes.md` § 4: insert a new §4.11 immediately after §4.10's closing paragraph and before the `---` / `## §5. Open items` heading. Verbatim:

```markdown
### §4.11 Step 8.3.6 — SchemaRow (schemaId, order) composite uniqueness constraint

Added 2026-05-21 per Step 8.3.6 (mirrors §4.7 Block). Prisma `@@unique([schemaId, order])` on the SchemaRow model enforces composite uniqueness at the DB layer. Pre-existing `lmsSchemaRowApi.create` flow (`_max(order) + 10` inside a `Serializable` transaction wrapped in `retryOnP2034`) was previously protected only by Postgres SSI false-positive detection — under SSI predicate-lock granularity edge cases, concurrent creates on the same schema could silently insert duplicate `(schemaId, order)` rows. Constraint addition eliminates the silent-corruption surface; the P2002 surface on the loser propagates as `ConflictError` via the existing `handlePrismaError`. Unlike §4.7, no reorder fix is needed: `lmsSchemaRowApi.reorder` (shipped Step 8.1b, commit `e1091719`) was already written in the canonical two-pass shift-to-negative form — Pass 1 stages every target row to a negative-order placeholder, Pass 2 assigns the final sparse orders — so swap reorders never collide on the intra-statement unique check. The §4.7 flavour-(h) lesson was already internalized when the Step 8.1b executor shipped `lmsSchemaRowApi`. Future enhancement (deferred carry-forward QA-001c, codebase-wide): widen `retryOnP2034` (or a new variant) to also retry P2002 on the `_max+N` insert pattern. Out of Step 8.3.6 scope.
```

### Phase 3 — `db:reset` + `db:seed`

```bash
pnpm --filter @repo/api-server db:reset
pnpm --filter @repo/api-server db:seed
```

`db:reset` recreates the schema with the new `@@unique` and applies `apply-sql-checks.ts` (3 SQL constraints, none `SchemaRow`-related — § 0.7); `db:seed` runs the seed (zero `SchemaRow` inserts — § 0.7). Both clean. `DATABASE_URL` must be the direct non-pooler URL (`[[neon-dev-direct-url]]`).

### Phase 4 — tests

**Phase 4a — the new P2002-floor case.** Add one test to `schema-row/admin.test.ts` — the structural mirror of Step 7.3.6's case 10. Shape: `provisionSchema()` for a fresh schema; raw-create one `SchemaRow` at `(ctx.schema.id, order: 10)` via `cleanupRaw.schemaRow.create`; then a second raw-create at the same `(ctx.schema.id, order: 10)` and assert it rejects with `code: "P2002"`; assert exactly one row is stored for the schema; `ctx.cleanup()` in a `finally`. Note — unlike `Block`'s `(sessionId, order)`-only raw create, `SchemaRow.create` requires the full non-nullable set (`schemaId`, `order`, `rowKind`, `rowPayload`); a `REST_SLOT` row (`rowKind: "REST_SLOT"`, `rowPayload: { rowKind: "REST_SLOT" }`) is the minimal valid shape — the existing `:460` test (`creates a REST_SLOT row with empty payload`) is the reference. The `cross-cutting` describe — beside the existing concurrent-create case — is the natural home; the executor decides placement.

**Phase 4b — regression re-check (no modification).** Re-run, unmodified, and verify green: `reorder > "renumbers three rows on the happy path"` (`:771`) — the two-pass reorder stays correct under `@@unique`; `cross-cutting > "concurrent create … P2034 retry"` (`:919`) — the defensive assertions tolerate the post-constraint failure-mode shift (§ 0.8, § 5 axis 2). **If either fails after the schema change — STOP and surface via `AskUserQuestion`** with the verbatim failure + a hypothesis. Do not silently modify either case. (This is the flavour-(h) checkpoint — if the reorder test fails, the § 0.4 / § 5-axis-3 trace was wrong and must be re-examined, not patched over.)

### Phase 5 — verifications (repo root)

`pnpm check-types` (16/16) · `pnpm lint` (16/16, 0 warnings) · `pnpm test` (root — 1692, baseline 1691 + 1 new) · `pnpm dep:check` (0 violations, no module-count delta — no new files). Any failure → diagnose the root cause + fix; never bypass a hook.

### Phase 6 — one atomic commit

Per § 6.

---

## § 4 — Acceptance criteria

1. ✅ `packages/api-server/prisma/schema.prisma` — `SchemaRow` has `@@unique([schemaId, order])` immediately before `@@index([schemaId, order])`; both retained; `@@map` last.
2. ✅ `analysis/artifacts/06-formalization/schema.prisma` — the identical `@@unique([schemaId, order])` on the `SchemaRow` mirror (no `@@map`).
3. ✅ `er-final.md` § 5 — new invariant #12 after #11, verbatim per Phase 2b; § 4 cardinality matrix unchanged.
4. ✅ `implementation-notes.md` — new §4.11 between §4.10 and `## §5`, verbatim per Phase 2c.
5. ✅ `05-synthesis/domain-model.md`, `stress-test.md`, `stress-final.md` — byte-identical (no domain-semantics / stress-case change).
6. ✅ `packages/api-server/src/endpoints/lms/schema-row/admin.ts` — **byte-identical** (reorder already two-pass; create/update/delete unaffected — D-8.3.6-3).
7. ✅ `db:reset` + `db:seed` run clean — no `SchemaRow` constraint conflict (seed has zero `SchemaRow` inserts; `lms-checks.sql` has zero entries).
8. ✅ The new P2002-floor test passes — a second raw `cleanupRaw.schemaRow.create` at a duplicate `(schemaId, order)` throws `code: "P2002"`; exactly one row stored.
9. ✅ The existing `reorder` happy-path (`:771`) and `concurrent create` (`:919`) cases re-run unmodified and stay green.
10. ✅ No new contract / mapper / route / client / UI change; `@repo/contracts`, `apps/*`, the seed, `prisma/sql/` — byte-identical.
11. ✅ The QA-001c / QA-W1 / QA-W2 carry-forwards untouched (D-8.3.6-5).
12. ✅ `pnpm check-types` 16/16; `pnpm lint` 16/16, 0 warnings; `pnpm test` 1692/1692 (baseline 1691 + 1); `pnpm dep:check` 0 violations, no module-count delta.
13. ✅ One atomic commit on `feat/training-domain` (schema + analysis + test); husky pre-commit + commit-msg + pre-push clean; zero `--no-verify` / `--no-edit` / `--no-gpg-sign`.
14. ✅ `git diff <prompt-commit>..HEAD` — changes confined to the 5 files in § 2 + `implementation/step-08.3.6/output.md`; everything else 0 lines.

---

## § 5 — Adversarial pass (per `[[planner-adversarial-review]]` — schema-constraint axes)

**Axis 1 — existing rows post-`db:reset`.** `db:reset` drops all data (`prisma db push --force-reset`); the constraint applies to a fresh schema — no data migration needed (non-prod Neon dev, `[[discipline-db-non-prod]]`). No regression risk.

**Axis 2 — `lmsSchemaRowApi.create` concurrent on one schema.** `create` reads `_max(order)` and writes `_max+10` inside a `Serializable` transaction wrapped in `retryOnP2034` (§ 0.4). Two concurrent creates both read the same `_max` and target the same `order`. Pre-`@@unique`: SSI usually detects the read-write overlap → one `P2034` → `retryOnP2034` re-reads `_max` → succeeds at `+10` more; the SSI-miss edge could silently insert a duplicate. Post-`@@unique`: the SSI path is unchanged (P2034 → retry → both fulfilled); the SSI-miss edge now hits the unique constraint → `P2002` on the loser → `handlePrismaError` → `ConflictError`. The silent-corruption case is eliminated. The existing `:919` test asserts `fulfilledCount >= 1` with a conditional `=== 2` block — green under both outcomes. The behavioural shift (a loser occasionally sees an immediate `P2002` instead of a retry) is **QA-001c**, a known carry-forward, not folded in (D-8.3.6-5).

**Axis 3 — `lmsSchemaRowApi.reorder` intra-transaction trace (THE flavour-(h) axis — `[[planner-mutation-invariant-trace]]`).** The reorder is array-form `prisma.$transaction([...phase1, ...phase2])` (§ 0.4), executed sequentially. For `orderedIds = [A, B, C]` with pre-reorder orders `A=10, B=20, C=30`:

- Phase 1 (`order: -(i+1)`): `UPDATE A→-1` (schema orders `{-1,20,30}` — distinct ✓); `UPDATE B→-2` (`{-1,-2,30}` ✓); `UPDATE C→-3` (`{-1,-2,-3}` ✓).
- Phase 2 (`order: (i+1)*10`): `UPDATE A→10` (`{10,-2,-3}` ✓); `UPDATE B→20` (`{10,20,-3}` ✓); `UPDATE C→30` (`{10,20,30}` ✓).

A swap (`orderedIds = [B, A]`, pre-orders `A=10, B=20`): Phase 1 `B→-1` (`{10,-1}` ✓), `A→-2` (`{-2,-1}` ✓); Phase 2 `B→10` (`{-2,10}` ✓), `A→20` (`{20,10}` ✓). **No intermediate UPDATE ever holds a colliding `order`** — the Phase 1 negatives are pairwise distinct and disjoint from the positive pre-reorder orders; the Phase 2 positives are pairwise distinct and disjoint from the remaining negatives. `reorder` requires `orderedIds.length === scopeCount` (every row of the schema) and pre-reorder orders are always positive (`create` uses `_max+10 ≥ 10`), so the negative staging range never collides. **The two-pass reorder is compatible with `@@unique([schemaId, order])` with zero changes.** This is the inverse of the Step 7.3.6 § 5 axis-3 verdict — but reached the right way: by the full intra-tx trace, not by an instinct. `schema-row/admin.ts` is not touched (D-8.3.6-3).

**Axis 4 — `lmsSchemaRowApi.update`.** `update` blocks structural keys (`rowKind`, `schemaId`) via `STRUCTURAL_UPDATE_KEYS` and conditional-spreads only `rowPayload` / `load` / `reps` / `side` / `tempo` / `position` / `sequence` / `intensity` / `media` / `compoundRep` / `notes` — it **never writes `order`**. No constraint risk. No regression.

**Axis 5 — `lmsSchemaRowApi.delete`.** `delete` removes a row, freeing its `(schemaId, order)` slot. No constraint risk. (FK `onDelete: Cascade` on `Schema → SchemaRow` is unaffected.) No regression.

**Axis 6 — test fixtures with hardcoded `order`.** Every test calls `provisionSchema()` → a fresh schema per test (`weekCounter` increments — § 0.8); rows are created via the API (`_max+10` → sparse `10/20/30`) — no duplicate `(schemaId, order)` within a schema. The new P2002-floor case (Phase 4a) is the **only** place a duplicate `order` is intentionally created — that is the test's point. Verify via § 0.A grep 4.

**Axis 7 — seed.** Zero `SchemaRow` inserts (§ 0.7) — `db:reset`+`db:seed` cannot conflict with the constraint. Verify via § 0.A grep 3.

**Axis 8 — concurrent reorder + reorder on one schema (out of scope, noted).** Two concurrent `reorder` calls on the same schema take row locks in `orderedIds` order; differing permutations can deadlock → Postgres kills one → `P2034` → (reorder is **not** `retryOnP2034`-wrapped) → propagates as `ConflictError` "modified concurrently, please retry". This is a **deadlock-class** surface — `@@unique` does not change it (two un-ordered `UPDATE` batches deadlock with or without the constraint). It is the same last-writer-wins / unwrapped-reorder territory as the codebase-wide QA-B5 / QA-B4 carry-forwards; Step 7.3.6 did not address concurrent reorder either. **Out of 8.3.6 scope** — noted, not fixed.

---

## § 6 — Commit strategy (one atomic commit, verified against live hook config per `[[husky-cross-package-squash]]`)

**Fan-out (§ 0.9).** `.husky/pre-commit` runs `turbo check-types --filter="...[HEAD]"`. 8.3.6 touches `packages/api-server/` (schema + test) and `analysis/` (not a code package). `@@unique` is type-system-neutral — the generated Prisma client type shape does not change, so no downstream package re-types; there is no broken intermediate tree. A cross-package squash is **not** required. One atomic commit is preferred for schema-change revertability — schema + analysis sync + test are one logical unit. Mirror Step 7.3.6 `85866ba1`.

**Commit (the whole step).** Subject e.g. `feat(training-domain): add unique constraint on schemarow (schemaid, order)` — verify ≤ 100 chars + fully lowercase (incl. `schemarow`, `schemaid` — commitlint `subject-case = lower-case`; check with `echo -n "<subject>" | wc -c`). Body via `-m` flags (each paragraph ≤ ~140 chars, lowercase; em-dashes near the 100-char mark can trip a commitlint body/footer split — short `-m` paragraphs are safe — Step 7.3.6 D-4): list the prisma constraint; the analysis sync (schema.prisma mirror + er-final #12 + implementation-notes §4.11); the test (P2002 floor); the db:reset/db:seed; the regression note (existing reorder + concurrent-create cases green, reorder already two-pass — no rewrite); an `analysis-files touched:` line.

Stage by **explicit names** (never `git add -A` / `git add .`, per `[[no-db-creds-in-settings-local]]`):

```bash
git add \
  packages/api-server/prisma/schema.prisma \
  packages/api-server/src/endpoints/lms/schema-row/admin.test.ts \
  analysis/artifacts/06-formalization/schema.prisma \
  analysis/artifacts/06-formalization/er-final.md \
  analysis/artifacts/06-formalization/implementation-notes.md
```

Husky pre-commit + commit-msg + pre-push all pass clean. Never `--no-verify` / `--no-edit` / `--no-gpg-sign` — a failing hook is a root cause to fix.

The planner writes the `docs(step-08.3.6): write executor output report` commit separately at close-out.

---

## § 7 — Out-of-scope / deferred (forward notes)

- **`lmsSchemaRowApi.reorder` rewrite — NOT this step (D-8.3.6-3).** Already two-pass (`e1091719`); the § 5 axis-3 trace proves compatibility. `schema-row/admin.ts` is byte-identical after 8.3.6.
- **`retryOnP2034`-passthrough timing test — NOT mirrored (D-8.3.6-4).** Step 7.3.6's second test case is deliberately not reproduced (helper-not-constraint scope; QA-023 timing-flake pattern).
- **QA-001c** — `retryOnP2034` widening to also retry `P2002` on the `_max+N` insert pattern (codebase-wide carry-forward, `03-deferred.md`). A future `/fix`.
- **QA-W1 / QA-W2** — the `lmsSchemaRowApi` delete/update/reorder in-tx `plan` re-check gaps (`03-deferred.md`). A future `/fix` bundle; 8.3.6 touches `admin.ts` not at all.
- **QA-001b** — `Session @@unique([dayId, order])`, the adjacent sibling latent surface (`03-deferred.md` "Pre-Step-8 cleanup"). Not `SchemaRow`, not this step — the same mirror pattern when scheduled.
- **`Schema` partial-unique** — `@@unique([parentSchemaId, order])` + the `schemas_block_top_order` partial index in `apply-sql-checks.ts` — is **Step 8.3.7**, the next step. Not 8.3.6.
- **Concurrent-reorder deadlock / last-writer-wins UX** — § 5 axis 8; codebase-wide QA-B4/QA-B5 territory. Not this step.

---

## § 8 — Verifications cheatsheet

```bash
# During work:
pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed
pnpm --filter @repo/api-server check-types
pnpm --filter @repo/api-server test    # schema-row/admin.test.ts among them

# Root sweep before output.md:
pnpm check-types        # 16/16
pnpm lint               # 16/16, 0 warnings
pnpm test               # 1692 (baseline 1691 + 1 new P2002-floor case)
pnpm dep:check          # 0 violations, no module-count delta

# Husky enforces per commit:
SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"               # pre-commit
SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"   # pre-push
```

The api-server test suite is single-config serial (~10 min) per `[[api-server-serial-tests]]` — expected. Pre-existing flake awareness: `block/admin.test.ts:406` timing assertion (QA-023) — re-run on flake, not a regression of this step.

---

## § 9 — Output report format (executor produces `implementation/step-08.3.6/output.md`)

Per WORKFLOW.md "`output.md` format":

```markdown
## Что сделано

## Изменённые/созданные файлы

## Принятые решения

## Возникшие вопросы и как решены

## Что отложено

## Ссылка на `.feature-dev/<ts>/`

## Verification notes

## Acceptance criteria self-check
```

Include an explicit **`analysis-files touched: 06-formalization/{schema.prisma, er-final.md, implementation-notes.md}`** line (WORKFLOW.md `analysis/` rules — a Prisma schema change records its analysis sync). No UI smoke-test scenario — N/A (backend/DB step; the constraint is verified by the api-server test).

---

## § 10 — Wrapper choice & process notes

**Wrapper**: `/feature small`. A single-package additive Prisma constraint + analysis sync + 1 test + `db:reset` — the structural mirror of Step 7.3.6, which ran `small`; 8.3.6 is narrower (no reorder rewrite). The `small` pipeline's Research + plan + review-light stages plus this prompt's § 0 rigor are the safety net.

**Branch**: `feat/training-domain` (long-lived). **No branch cut** — override the `/feature` skill's default `feat/<slug>` cut.

**Per-step cycle**: thesis ratified in the planner-user chat 2026-05-21 (two-voice; OQs confirmed — D-8.3.6-1..7). Jump to `/feature` Stage 1 (Research).

**Escalation** (WORKFLOW.md "Executor escalation protocol"): if anything the spec did not anticipate surfaces — a § 0 verbatim quote that no longer matches, a § 0.A grep with an unexpected hit, the Phase 4b regression re-check failing (especially the `reorder` happy-path — that would mean the § 5 axis-3 trace was wrong), a `db:reset`/`db:seed` conflict — **STOP and surface via `AskUserQuestion`** with the verbatim evidence + a hypothesis. Do not silently adapt. In particular: do **not** rewrite `lmsSchemaRowApi.reorder` (it is already two-pass — D-8.3.6-3); do **not** add a SQL constraint to `lms-checks.sql` (Step 8.3.7's surface); do **not** fold in QA-001c / QA-W2; do **not** touch `domain-model.md` or the stress files.

**Handoff after close-out**: Step 8.3.7 — `Schema` partial-unique (`@@unique([parentSchemaId, order])` + the `schemas_block_top_order` partial index in `apply-sql-checks.ts` WHERE `parent_schema_id IS NULL` + a dual-scope reorder). Then **8.4 anchor** — the first coach-visible schema editor.

---

**End of prompt.**

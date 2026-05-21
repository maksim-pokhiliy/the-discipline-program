# Step 08.3.6 — Executor output report

> Wrapper: `/feature small` (per `[[always-via-feature-skill]]` + `[[training-domain-workflow]]`). Branch: `feat/training-domain` (no cut). Commit: `b32fd892`.

---

## Что сделано

Shipped `@@unique([schemaId, order])` on the `SchemaRow` Prisma model — DB-level enforcement of the positional-uniqueness invariant, the structural mirror of Step 7.3.6's `Block @@unique([sessionId, order])`. Synced the three `analysis/06-formalization/` artifacts (the `schema.prisma` mirror, `er-final.md` § 5 invariant #12, `implementation-notes.md` § 4.11), added one P2002-floor regression test, ran `db:reset` + `db:seed`, full Phase 5 verifications.

Single atomic commit on `feat/training-domain` (5 files; `@@unique` is type-system-neutral → no cross-package fan-out, no broken intermediate tree → no squash needed). Husky pre-commit / commit-msg / pre-push clean, zero skip flags.

**No reorder rewrite** (unlike Step 7.3.6's execution-time scope expansion): `lmsSchemaRowApi.reorder` was shipped in Step 8.1b (`e1091719`) already in the canonical two-pass shift-to-negative form. Verbatim-read confirmed (§ 0.4) and the § 5 axis-3 intra-transaction trace re-walked at execution time — every intermediate UPDATE holds a pairwise-distinct `order`, the constraint is compatible with zero changes. `schema-row/admin.ts` is byte-identical after this step.

---

## Изменённые/созданные файлы

| Файл                                                             | LOC          | Тип                                                 |
| ---------------------------------------------------------------- | ------------ | --------------------------------------------------- |
| `packages/api-server/prisma/schema.prisma`                       | +1           | Prisma `@@unique([schemaId, order])` on `SchemaRow` |
| `analysis/artifacts/06-formalization/schema.prisma`              | +1           | Analysis-mirror `@@unique` (no `@@map`)             |
| `analysis/artifacts/06-formalization/er-final.md`                | +1           | § 5 cross-cutting invariant #12                     |
| `analysis/artifacts/06-formalization/implementation-notes.md`    | +4           | § 4.11 step record                                  |
| `packages/api-server/src/endpoints/lms/schema-row/admin.test.ts` | +34          | +1 test (P2002 floor, `cross-cutting` describe)     |
| **Total**                                                        | **+41 / −0** | purely additive                                     |

**analysis-files touched** (per WORKFLOW.md `analysis/` rules): `06-formalization/{schema.prisma, er-final.md, implementation-notes.md}`.

**Untracked (NOT staged)**: `implementation/step-08.3.6/output.md` (this file — separate `docs(step-08.3.6)` commit per planner close-out convention, prompt § 6).

---

## Принятые решения

### D-EXEC-1 — `/feature small` pipeline run partly inline; one reorder of stages

The feature is genuinely tiny and the prompt is an exhaustive spec (research + design + plan in one). S-Stage 1 (verification of § 0 verbatim sources + § 0.A greps) and S-Stage 2/4 (the 4 edits + the test) were done inline by the orchestrator — they are mechanical verification + verbatim application, and doing them inline let the orchestrator observe results directly for the escalation protocol. S-Stage 3 (Review-Light) was delegated to an independent agent — that is where a fresh pair of eyes has real value. The skill's S-Stage order is Implement → Review → Test; the executor ran **Implement → Test → Review** so the Review-Light agent reviewed the _complete_ diff (schema + analysis + the new test), not a test-less subset. All `/feature small` artifacts produced (`research.md`, `review.md`, `tasks.md`).

### D-EXEC-2 — `.env.test` confirmed a stale orphan; tests run against the `.env` dev DB

`packages/api-server/.env.test` exists with a _different_ Neon DB host (`ep-autumn-brook-…-pooler`) than `.env` (`ep-quiet-sunset`, the DB `db:reset` targets). This raised a real risk: if vitest loaded `.env.test`, the prompt's `db:reset` → `test` chain would prep the wrong DB and the P2002-floor test would false-fail. Resolved empirically (a throwaway probe test inside `vitest run`, deleted immediately): the test process connects to **`ep-quiet-sunset`** — the `.env` dev DB, exactly what `db:reset` targets. `.env.test` is not loaded by the current api-server vitest config (likely a leftover of the dropped e2e suite, `[[e2e-dropped]]`); it is a local-only gitignored file, not a repo artifact, so no change made. The prompt's Phase 3 → Phase 4/5 chain is correct.

---

## Возникшие вопросы и как решены

### Q-1 — Which database does the test suite connect to? (`.env` vs `.env.test`)

See D-EXEC-2. The prompt assumed `db:reset` (which targets `.env`) preps the DB the tests use. The presence of a separate `.env.test` made this worth verifying rather than assuming. Empirical probe → tests use `.env`'s dev DB. Not a prompt error; the prompt is correct. No escalation needed.

### Q-2 — § 0.A grep 1 surfaced four test files the prompt did not explicitly enumerate

`grep "cleanupRaw.schemaRow.create"` hit `week/admin.test.ts`, `day/admin.test.ts`, `schema/admin.test.ts`, `authz/guards.test.ts` — beyond the prompt § 0.A item-1 abbreviated expected list ("week/day read includes, test fixtures"). Each raw `SchemaRow` insert was read and verified: `week:429/437` (orders 10/20, same schema — distinct), `week:596/604` (orders 20/10 — distinct), `day:318` / `schema:862` / `guards:403` (single row each). No fixture inserts a duplicate `(schemaId, order)`; the new constraint is compatible with every one. Same situation as Step 7.3.6 Q-1 (abbreviated enumeration, not real drift) — proceeded without escalation. `authz/lms-guards.ts:264` is a read-only `findUnique`.

### Q-3 — Prompt § 0.8 `create`-describe count off by one (cosmetic, no impact)

Prompt § 0.8 describes the `create` describe in `schema-row/admin.test.ts` as 15 cases; the actual count is 14 (the file holds 31 tests pre-change). This is a miscount in a § 0.8 parenthetical only and affects no number that matters: the prompt § 8 `pnpm test` baseline of 1691 is exact, and the run confirms **1692** (1691 + the 1 new case); `schema-row/admin.test.ts` is 32/32. Noted for accuracy; no action taken.

---

## Что отложено

Per D-8.3.6-5 / § 7 — not folded into this step, unchanged:

- **QA-001c** — widen `retryOnP2034` (or a new variant) to also retry `P2002` on the `_max+N` insert pattern. Post-`@@unique`, a concurrent-create loser may surface an immediate `P2002` instead of a `P2034` retry. Codebase-wide carry-forward (`03-deferred.md`). A future `/fix`.
- **QA-W1 / QA-W2** — `lmsSchemaRowApi` delete/update/reorder in-tx `plan.deletedAt` re-check gaps. `schema-row/admin.ts` was not touched at all this step. A future `/fix` bundle.
- **QA-001b** — `Session @@unique([dayId, order])`, the adjacent sibling latent surface. The same mirror pattern, a future step.
- **`Schema` partial-unique** — `@@unique([parentSchemaId, order])` + the `schemas_block_top_order` partial index in `apply-sql-checks.ts` — is **Step 8.3.7**, the next step.
- **Concurrent-reorder deadlock / last-writer-wins UX** — § 5 axis 8; codebase-wide QA-B4/QA-B5 territory.

---

## Ссылка на `.feature-dev/<ts>/`

`.feature-dev/1779369474/` — `/feature small` artifact dir: `research.md` (S-Stage 1 verification record), `review.md` (Review-Light — `VERDICT: APPROVE`, zero findings), `tasks.md`. The planner prompt § 0–§ 5 _is_ the research + design + plan; `.feature-dev/` artifacts are the execution-time verification layer on top.

---

## Verification notes

### Phase 3 — `db:reset` + `db:seed`

`db:reset` (`prisma db push --force-reset` → dev DB `ep-quiet-sunset`, Prisma client regenerated, `apply-sql-checks.ts` applied 3 SQL constraints — none `SchemaRow`-related). `db:seed` clean: 34 archetypes, 13 users, 4 training plans — **zero `SchemaRow` inserts**, no conflict with the new constraint.

### Phase 4 — tests

`pnpm --filter @repo/api-server test src/endpoints/lms/schema-row/admin.test.ts` → **32 passed (32)**, 0 failed (31 baseline + 1 new). Covers Phase 4a (the new `enforces composite uniqueness on (schemaId, order) via P2002` case — passes, which _proves_ the constraint fires: absent the constraint, `.rejects.toMatchObject` would fail on a resolved promise) and Phase 4b regression (`reorder > renumbers three rows on the happy path` :771 and `cross-cutting > concurrent create … P2034 retry` :919 — both re-run unmodified, green).

### Phase 5 — root sweep

- `pnpm check-types` — **16/16** successful.
- `pnpm lint` — **16/16** successful, 0 warnings.
- `pnpm dep:check` — **0 violations** (1283 modules, 2427 dependencies; no module-count delta — no new files).
- `pnpm test` — **1692 passed (1692)**, 132 test files, 0 failed — exactly the prompt's predicted baseline 1691 + the 1 new P2002-floor case. Duration 545s.

### Phase 6 — commit

Commit `b32fd892` on `feat/training-domain` — `feat(training-domain): add unique constraint on schemarow (schemaid, order)`, 5 files changed, +41/−0. Husky pre-commit (`check-secrets` + `lint-staged` + `turbo check-types --filter="...[HEAD]"` 15/15 successful, 11 cached) and commit-msg (commitlint) both clean. Zero `--no-verify` / `--no-edit` / `--no-gpg-sign`.

---

## Acceptance criteria self-check

| #   | Criterion                                                                                      | Status | Notes                                            |
| --- | ---------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------ |
| 1   | live `schema.prisma` `SchemaRow` has `@@unique` before `@@index`; both retained; `@@map` last  | ✓      | verbatim per § 0.2                               |
| 2   | analysis `schema.prisma` identical `@@unique` on the mirror (no `@@map`)                       | ✓      | verbatim per § 0.3                               |
| 3   | `er-final.md` § 5 invariant #12 after #11, verbatim; § 4 matrix unchanged                      | ✓      | byte-identical to Phase 2b                       |
| 4   | `implementation-notes.md` § 4.11 between § 4.10 and `## §5`, verbatim                          | ✓      | byte-identical to Phase 2c                       |
| 5   | `domain-model.md`, `stress-test.md`, `stress-final.md` byte-identical                          | ✓      | not in diff                                      |
| 6   | `schema-row/admin.ts` byte-identical (reorder already two-pass — D-8.3.6-3)                    | ✓      | `git diff` empty for the file                    |
| 7   | `db:reset` + `db:seed` run clean — no `SchemaRow` constraint conflict                          | ✓      | zero `SchemaRow` seed inserts                    |
| 8   | the new P2002-floor test passes — duplicate raw insert throws `P2002`; one row stored          | ✓      | schema-row file run 32/32                        |
| 9   | existing `reorder` :771 + `concurrent create` :919 re-run unmodified, green                    | ✓      | schema-row file run 32/32                        |
| 10  | no contract/mapper/route/client/UI change; `@repo/contracts`, `apps/*`, seed, `prisma/sql/`    | ✓      | not in diff                                      |
| 11  | QA-001c / QA-W1 / QA-W2 carry-forwards untouched                                               | ✓      | `admin.ts` byte-identical                        |
| 12  | `check-types` 16/16 · `lint` 16/16 (0 warn) · `pnpm test` 1692/1692 · `dep:check` 0 violations | ✓      | all four green                                   |
| 13  | one atomic commit on `feat/training-domain`; husky clean; zero skip flags                      | ✓      | commit `b32fd892`; pre-commit + commit-msg clean |
| 14  | `git diff` confined to the 5 § 2 files + `implementation/step-08.3.6/output.md`                | ✓      | diff = 5 files, +41/−0                           |

No UI smoke-test scenario — N/A (backend/DB step; the constraint is verified by the api-server test).

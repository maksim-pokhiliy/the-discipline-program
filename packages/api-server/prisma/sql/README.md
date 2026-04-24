# Raw SQL constraints

This directory holds CHECK constraints that cannot be expressed in `schema.prisma` with Prisma 6.1 (no `@@check` support; `checkConstraints` preview arrives in Prisma 7).

Constraints are applied via `pnpm db:apply-constraints`, which is chained into:

- `pnpm db:push` — applies schema diffs then the constraints.
- `pnpm db:reset` — wipes, pushes, then applies constraints.

Do NOT run `npx prisma db push` directly — it skips the wrapper and silently drops the constraints on the next schema diff. Always go through the pnpm scripts.

Files:

- `workout_block_exercise_xor.sql` — enforces `(blockId IS NULL) <> (emomSlotId IS NULL)` on `app_workout_block_exercises`.

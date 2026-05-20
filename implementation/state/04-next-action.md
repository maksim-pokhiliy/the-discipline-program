# Next planner action

> Concrete next-action handoff brief. Updated every close-out as the queue shifts.

## Status: Step 8.2 CLOSED 2026-05-20

Platform HTTP routes for the `Schema` / `SchemaRow` / `AlternatingGroup` api slices shipped — 10 Next.js App Router `route.ts` handlers over all 12 write methods + contract enablers (named route-param schemas + `z.union`-widened reorder-request schemas). 7 executor code/test commits `499b11cb..716c95f2` + 2 planner docs commits + close-out. Composition mirrors the Block precedent (Step 7.2): `withCoachAuth( withAuthRateLimit( createAuth*Handler(...), RATE_LIMIT_TIER.API ) )`. D-8.2-7 ratified mid-execution: the widened reorder request schema is a `z.union`, not `superRefine`. Review APPROVED / QA Score A; `pnpm test` 1680/1680; scope confined (`api-server` / `api-routes` / Prisma / `analysis/` 0 lines). Full entry: [../log/step-08.2.md](../log/step-08.2.md).

## Next planner action: Step 8.3 thesis cycle — platform client API + hooks

Client API factories + TanStack Query mutation hooks for the `Schema` / `SchemaRow` / `AlternatingGroup` slices, mirroring Step 7.3 (Block). The 8.2 HTTP routes are the call target. 8.3 wires `apps/platform/src/lib/api/endpoints/` factories + `apps/platform/src/lib/hooks/use-*.ts` mutation hooks. **`/feature small`** likely — Step 7.3 (Block hooks) was `small`; 8.3 is 3× the same thin-wrapper pattern, confirm at prompt-write by the file count. Walkthrough gate: 8.3 ships no UI — the thesis walkthrough describes the **final coach UX** the hooks will serve (the plan-editor mutations 8.4 surfaces), screen-only language per `[[coach-daily-ux-priority]]` (no HTTP / hook / query-key terms in the coach view).

**Thesis OQ surface (8.3's to ratify):**

- **Collapsed vs. per-entity split.** ~3 endpoint files + ~3 hook files + barrels. Hypothesis: collapsed single step — Step 7.3 Block was one `/feature small`; 8.3 is 3× the same thin pattern, well within one step.
- **Hook helper + invalidation.** Step 7.3 built mutation hooks via the `useWeekMutation` helper, each invalidating `platformKeys.weeks.byDate(planId, startDate)` (full week-tree refresh). Hypothesis: 8.3 reuses `useWeekMutation` identically — Schema / SchemaRow / AlternatingGroup mutations all invalidate the same week-tree key (the editor renders them inside the week view).
- **`removeMember` nullable result.** The `useRemoveMember` mutation result type is `AlternatingGroup | null` (the contract response). Hypothesis: pass the nullable through to the caller; the future UI branches on `null` = group dissolved.
- **reorder scope shape (carry QA-I1).** The `useReorderSchemas` hook builds the `reorderSchemasRequestSchema` body — the `z.union` rejects an explicit `parentSchemaId: null`. Hypothesis: the hook's TVars carries a `CreateScope`-shaped discriminated arg and sends the scope key **absent**, never `null`.
- **API factory signature.** Step 7.3 `createBlocksAPI` used a flat id-addressed signature (no `DayOfWeek` import). Hypothesis: `createSchemasAPI` / etc. mirror it — `planId` + the route-specific ids/body.

**Reference points to read at 8.3 prompt-write time:**

- Step 7.3 entry — `implementation/log/_archive-pre-refactor.md` (search `## Step 7.3`) — the canonical client-API + hooks precedent (`createBlocksAPI` + 5 `useBlock*` hooks via `useWeekMutation`).
- `apps/platform/src/lib/api/endpoints/blocks.ts` + `apps/platform/src/lib/api/endpoints/index.ts` + `apps/platform/src/lib/api/index.ts` — the client-API factory + its barrels (registration files — read verbatim per `[[planner-verbatim-registration]]`).
- `apps/platform/src/lib/hooks/use-blocks.ts` + `apps/platform/src/lib/hooks/index.ts` — the hook precedent.
- `apps/platform/src/lib/api/keys.ts` — the `platformKeys` query-key factory (invalidation targets).
- The 8.2 routes (`apps/platform/src/app/api/platform/training-plans/[planId]/{schemas,schema-rows,alternating-groups}/`) — the call target; the request/response contract schemas are their inputs.

**Carry-forwards into the 8.3 thesis:**

- **QA-I1** — the `useReorderSchemas` hook must send the scope key absent (not `null`); the `z.union` request schema rejects explicit `null`. Active in `03-deferred.md`. The 8.3 thesis addresses the hook's TVars scope shape.
- **REVIEW-I4/I5/I6 + QA-W1 + QA-D1** — deferred `/fix` bundle (`03-deferred.md`); 8.3 is client hooks, touches none of them. QA-D1 widened at the 8.2 close-out (the reorder `.max()` gap is codebase-wide).
- **No read hook.** 8.3 hooks call only the 12 write routes — no GET route exists (D-8.2-2). The read surface is Step 8.3.5.

## Process reminders (active from Step 8.1c)

- Thesis = two voice-coded sections (coach view + developer view) per `[[thesis-format]]`; coach view carries the mandatory 1-paragraph walkthrough per `[[coach-walkthrough-gate]]`, **screen-only language** per `[[coach-daily-ux-priority]]` (no HTTP / route / hook / query-key terms in the coach view).
- Prompt is spec-only per `[[planner-strategic-level]]` — § 0 verbatim quotes of existing code stay; no prescriptive new-code skeletons in § 3.
- When prescribing any schema / type shape, simulate its inferred type, not just its runtime behaviour — flavour (i) `[[planner-lint-impact-trace]]` Zod sub-axis (Step 8.2 finding).
- `/feature` (small or full per scope), `feat/training-domain` long-lived branch, no branch cut.

## After Step 8.3 close-out

Per [01-step-queue.md](01-step-queue.md) execution order: 8.3 → 8.3.5 (read-embed) → 8.3.6 (SchemaRow `@@unique`) → 8.3.7 (Schema partial-unique) → **8.4 anchor** → **9.1..9.11** → **8.5..8.20** → 10.

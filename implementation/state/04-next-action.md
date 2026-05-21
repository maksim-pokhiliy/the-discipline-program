# Next planner action

> Concrete next-action handoff brief. Updated every close-out as the queue shifts.

## Status: Step 8.3 CLOSED 2026-05-21

Platform client API + TanStack hooks for the three slices shipped — 3 `createXxxAPI` endpoint factories (12 methods) + 12 `useXxx` mutation hooks on `useWeekMutation`, mirroring Step 7.3 (Block). 2 code commits `f0adca8a..10bcd4b6` + prompt/output docs + close-out. Review-Light APPROVED (0 findings); `pnpm test` 1680/1680; scope confined to `apps/platform/src/lib/{api,hooks}/`. D-8.3-4 (api-level `*Request` reorder types — closes `QA-I1`) and D-8.3-5 (`removeMember` via `client.request`) the two load-bearing points. Full entry: [../log/step-08.3.md](../log/step-08.3.md).

## Next planner action: Step 8.3.5 thesis cycle — `schemas[]` read-embed

The read surface. After 8.3 the **write** path for the three slices is complete end-to-end (contracts → api-server → routes → client hooks), but nothing reads a Schema back — `blockSchema` does not embed `schemas[]`, and there is no GET route (D-8.2-2). Step 8.3.5 adds the read: a `schemas[]` embed into `blockSchema` so the future plan-editor (8.4) can render the schemas inside each block. Mirror Step 7.3.5 (Block embed into the week response). Cross-package — `packages/contracts` (`blockSchema` widened) + `packages/api-server` (mapper + include) — a likely squash candidate per `[[husky-cross-package-squash]]`; confirm at prompt-write by reading `.husky` + the fan-out. `/feature small` per the queue.

**Thesis OQ surface (8.3.5's to ratify):**

- **`schemas[]` embed shape + recursion depth.** `blockSchema` gains `schemas: SchemaWithBody[]`. `SchemaWithBody` (`schema.types.ts`) is recursive (`{ schema, rows, subSchemas: SchemaWithBody[] }`) — but the domain bounds it: a sub-schema is always `kind === "ATOMIC"` (domain §1.5), and an atomic schema has no sub-schemas → the tree is depth-2 (schema → atomic sub-schema). Hypothesis: a fixed depth-2 Prisma `include` — the embed carries `rows` + one level of `subSchemas` (each with its own `rows`, no deeper nesting).
- **`AlternatingGroup` embed — same step or separate.** D-A2 deferred `Schema` group-membership read to "a future `AlternatingGroup` embed (mirrors the Step 8.3.5 `schemas[]` read-embed pattern)". Hypothesis: fold the group read into 8.3.5 — one read-enabler step; 8.4 renders schemas and their alternating grouping together. Confirm scope at thesis-time; split only if it bloats the step.
- **Mapper.** `mapToBlockWithSchemas` extending `mapToBlock` with the nested `Schema → SchemaWithBody` assembly — a pre-existing `03-deferred.md` carry-forward, triggered here. The `DAY_INCLUDE` / `BLOCK_WITH_LABELS_INCLUDE` hoist carry-forwards may reach their 3rd callsite here too.
- **Client adapter.** Once `blockSchema` embeds `schemas[]`, `useWeek` already carries them — likely no new client hook, just the widened type flowing through. Confirm whether any client-side adapter is needed (per `[[planner-read-surface-trace]]` — trace the read path forward to where 8.4 consumes it).

**Reference points to read at 8.3.5 prompt-write time:**

- Step 7.3.5 entry — `implementation/log/_archive-pre-refactor.md` (search `## Step 07.3.5`) — the canonical read-embed enabler precedent (Block embed into the week response, `mapToSessionWithLabelAndBlocks`).
- `packages/contracts/src/entities/lms/block/block.schema.ts` — `blockSchema`, the file widened.
- `packages/api-server/src/mappers/lms/block.mapper.ts` + the week/day include chain — the mapper + include surface.
- `analysis/artifacts/05-synthesis/domain-model.md` §1.4-1.5 — Schema / SubSchema semantics + the `sub.kind === atomic` recursion bound.

**Walkthrough gate (8.3.5).** 8.3.5 is a backend/contract enabler — the thesis walkthrough describes the **final coach UX** the embed serves: the coach opening a block in the plan-editor and seeing its schemas (header + body) rendered inside it, which Step 8.4 surfaces. Screen-only language per `[[coach-daily-ux-priority]]`.

## Carry-forwards into the 8.3.5 thesis

- **`mapToBlockWithSchemas` / `DAY_INCLUDE` hoist / `BLOCK_WITH_LABELS_INCLUDE` hoist** — `03-deferred.md` "Step 8 surface triggers"; 8.3.5 is their natural trigger.
- **D-A2** — `Schema` group-membership read deferred to "a future `AlternatingGroup` embed"; 8.3.5 is that step (or its sibling — see the OQ above).
- **Toast-policy** — deferred (D-8.3-6, `03-deferred.md` "Step 8.3 follow-ups"); not 8.3.5 scope (read-side, no mutation).
- **REVIEW-I4/I5/I6 + QA-W1/W2 + QA-D1 + QA-I2** — separate `/fix` bundle (`03-deferred.md`); 8.3.5 touches none.

## Process reminders (active from Step 8.1c)

- Thesis = two voice-coded sections (coach view + developer view) per `[[thesis-format]]`; coach view carries the mandatory 1-paragraph walkthrough per `[[coach-walkthrough-gate]]`, screen-only language per `[[coach-daily-ux-priority]]`. **Walkthrough concrete examples (archetype names, rowKinds, exercise prescriptions) are domain claims** — ground them in `analysis/artifacts/` or keep them generic (Step 8.3 thesis-cycle lesson — the "EMOM 12" instinct-spec, flavour (b) `[[coach-pov-first]]`).
- Prompt is spec-only per `[[planner-strategic-level]]` — § 0 verbatim quotes of existing code stay; no prescriptive new-code skeletons in § 3.
- When prescribing any schema / type shape, simulate its inferred type, not just its runtime behaviour — flavour (i) `[[planner-lint-impact-trace]]`.
- For a contract response-shape change read every consumer verbatim — flavour (f) `[[planner-consumer-pattern-read]]` (8.3.5 widens `blockSchema` — every route handler + client hook reading a block is a consumer).
- `/feature` (small or full per scope), `feat/training-domain` long-lived branch, no branch cut.

## After Step 8.3.5 close-out

Per [01-step-queue.md](01-step-queue.md) execution order: 8.3.5 → 8.3.6 (SchemaRow `@@unique`) → 8.3.7 (Schema partial-unique) → **8.4 anchor** → **9.1..9.11** → **8.5..8.20** → 10.

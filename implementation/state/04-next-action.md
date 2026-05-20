# Next planner action

> Concrete next-action handoff brief. Updated every close-out as the queue shifts.

## Status: Step 8.1d CLOSED 2026-05-20

`lmsAlternatingGroupApi` api-server vertical shipped — 6 commits `a2e261e8..66626a11` + close-out docs commit; **PR #199 merged into `main` 2026-05-20** (Steps 8.1c + 8.1d together), `feat/training-domain` re-cut from fresh `main` (`9a5c217e`). 4-method endpoint (`create` / `addMember` / `removeMember` / `delete`) + `verifyAlternatingGroupOwnership` guard + `mapToAlternatingGroup` mapper + `addMember` / `removeMember` contract schemas (response nullable for D-A4 dissolve) + `createAlternatingGroupSchema.schemaIds.max(24)` (QA-004 closure) + D-A4 scope expansion to `lmsSchemaApi.delete` (group-aware, one Serializable tx). Review APPROVE / QA PASS, 1670/1670 tests, 38 adversarial attacks attempted with 0 exploited. Full entry: [../log/step-08.1d.md](../log/step-08.1d.md).

## Next planner action: Step 8.2 thesis cycle — platform HTTP routes

HTTP routes for the `Schema` / `SchemaRow` / `AlternatingGroup` api slices (mirror Step 7.2 for Block). The api-server vertical is complete after 8.1d; Step 8.2 wires HTTP in `packages/api-routes` + handler files in `apps/platform/src/app/api/...`. **`/feature small`** unless the file count > 6-7 (then per-entity split 8.2a/b/c). Walkthrough gate: thesis must include a 1-paragraph coach walkthrough — Step 8.2 is HTTP-only, so the walkthrough describes the **final coach UX** the routes will serve (the plan-editor schema/row/group mutations that 8.3 hooks + 8.4 UI surface).

**Thesis OQ surface (8.2's to ratify):**

- **Per-entity split vs. single step.** At prompt-write time `grep -rn "lmsSchemaApi\|lmsSchemaRowApi\|lmsAlternatingGroupApi" packages/api-routes/ apps/platform/src/app/api/` decides; > 6-7 file touch ⇒ split into 8.2a (Schema) / 8.2b (SchemaRow) / 8.2c (AlternatingGroup); ≤ 6 ⇒ single step. Hypothesis: collapsed (~5-6 route files total — Block precedent under Step 7.2 was ~4 files).
- **`removeMember` nullable-response wiring.** Route returns `200 { ...group }` vs `200 null` vs `200 group | 204 No Content` on dissolve. Hypothesis: `200` with a nullable body matching the contract `alternatingGroupSchema.nullable()` — single response shape, the client-side type is already `AlternatingGroup | null`, simplest for the future TanStack hook.
- **Member-id route shape.** `POST /alternating-groups/:id/members` body `{ schemaId }` for `addMember`; `DELETE /alternating-groups/:id/members/:schemaId` path-param for `removeMember`. Hypothesis: REST-idiomatic — `add` carries the member id in the body (post-create-style), `remove` in the path (delete-by-id-style). 8.1d's contract member-ref schema (`{ schemaId: cuid }`) is reusable as a body parser for `add`; `remove` composes `idParamSchema` + a `schemaId` param.
- **`create` route — group within a plan.** `POST /plans/:planId/alternating-groups` body `{ relationKind, schemaIds }`. Mirrors Block / Schema / SchemaRow create idioms (plan-scoped POST).
- **`delete` route.** `DELETE /alternating-groups/:id`. Bare id-only.
- **Role gates.** Guards already enforce coach-or-admin; routes inherit. No new authz logic at the route layer.

**Reference points to read at 8.2 prompt-write time:**

- Step 7.2 prompt + log (`implementation/log/step-07.2.md` if present in archive, else the pre-refactor archive) — canonical precedent for HTTP-route-only steps in this workflow.
- `packages/api-routes/src/lms/block/` (and siblings) — canonical routes-package layout (route definitions, OpenAPI/Zod wiring).
- `apps/platform/src/app/api/...` — Block route handler precedent (handler wrap + auth + body/params Zod parse + `lmsBlockApi` call + response mapping).
- 8.1d contract schemas — `createAlternatingGroupRequestSchema`, the member-ref request, the `addMember` / `removeMember` response (nullable). All shipped, awaiting routing.
- 8.1d api method signatures: `lmsAlternatingGroupApi.create(userId, planId, data)`, `.addMember(userId, groupId, schemaId)`, `.removeMember(userId, groupId, schemaId): Promise<AlternatingGroup | null>`, `.delete(userId, groupId)`.

**Carry-forwards into the 8.2 thesis:**

- **PR #199 review (`claude[bot]`)** — CI review on merged #199, verdict LGTM, all notes non-blocking. 3 polish items logged as `REVIEW-I4/I5/I6` in `03-deferred.md` (one `/fix` bundle, schedulable with QA-W1). Review note #1 — `schemaIds` is not contract-documented as ordered, though `mapToAlternatingGroup` orders by `Schema.order asc` — **lands as an 8.2 acceptance item**: the 8.2 route response is the consumer surface, so the prompt pins the ordering with an explicit route-handler ordering-assertion test (no code comment — project no-comments rule). Note #3 folded into QA-W1; note #5 discarded (ADR-0019).

- **QA-W1** — in-tx `plan` re-check missing on `lmsSchemaRowApi.update`/`.delete` and (PR #199 note #3) `lmsAlternatingGroupApi.delete`, which runs with no transaction at all (Active in `03-deferred.md`). 8.2 is HTTP, does NOT touch these methods; stays deferred to a separate `/fix`.
- **QA-E3** — `userId === undefined` propagation across all guards including the new `verifyAlternatingGroupOwnership` (Active). HTTP layer typically validates `userId` from session/auth before calling the api; verify the auth wrap catches `undefined` before the guard call (likely already does — confirm at prompt-write).
- **8.1d Stage-6 QA-1** — concurrency test for D-A4 dissolve-below-2 under interleaved `removeMember` + `lmsSchemaApi.delete` is NOT written (planner-allowed skip per `[[postgres-ssi-upsert-unique-key]]`). Correctness is by-design (Serializable + `retryOnP2034`); regression watch only. Out of 8.2 scope.

## Process reminders (active from Step 8.1c)

- Thesis = two voice-coded sections (coach view + developer view) per `[[thesis-format]]`; coach view carries the mandatory 1-paragraph walkthrough per `[[coach-walkthrough-gate]]`. For backend-only Step 8.2: describe the final coach UX the routes will serve.
- Prompt is spec-only per `[[planner-strategic-level]]` — § 0 verbatim quotes of existing code stay; no prescriptive new-code skeletons in § 3.
- `/feature` (small or full per scope), `feat/training-domain` long-lived branch, no branch cut.

## After Step 8.2 close-out

Per [01-step-queue.md](01-step-queue.md) execution order: 8.2 → 8.3 (client hooks) → 8.3.5 (read-embed) → 8.3.6 (SchemaRow `@@unique`) → 8.3.7 (Schema partial-unique) → **8.4 anchor** → **9.1..9.11** → **8.5..8.20** → 10.

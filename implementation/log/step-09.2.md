# Step 09.2 — SchemaRow body editor: REST + INNER_LADDER_MARKER + STANDALONE_URL rowKinds

- **Date**: 2026-05-22 (prompt written 2026-05-22; executor ran + close-out same day).
- **Feature-dev artifacts**: `.feature-dev/1779459924/` (research / design / plan / review / qa / tasks — `/feature` full pipeline, 9 stages).
- **Prompt**: `implementation/step-09.2/prompt.md` (planner-written 2026-05-22; commit `417e137a`; D-9.2-1..8 ratified upfront).
- **Output**: `implementation/step-09.2/output.md` (executor self-report — AC 1-10 MET; AC-11 browser smoke user-run + accepted 2026-05-22).

## Summary

Three more SchemaRow body-editor rowKinds — `REST`, `INNER_LADDER_MARKER`, `STANDALONE_URL`. The add-row menu went from 1 working rowKind of 8 to 4. Each new rowKind is a self-contained `*RowForm` mirroring the 9.1 `StandaloneLoadRowForm` (owns `useForm` + `zodResolver` + `FormModal` + `useCreateSchemaRow`/`useUpdateSchemaRow`, exported `toFormData`, `useEffect(reset, [mode])`, an `onSubmit` assembling `rowPayload as const`). All three registered in `ROW_KIND_FORM_REGISTRY` (now 4); the dispatch infra (`RowEditorModal` / `AddRowButton` / `SchemaRowList`) is untouched — rowKind-agnostic, 9.2 only populated the registry. Beyond the three forms:

- **`StepArrayFields`** — a reusable controlled chip-array number editor (`{ value: number[], onChange, error?, disabled? }`): type a positive integer → a chip; remove a chip; a UI `.min(1)` floor (the last chip is not removable); repeats allowed (`11-9-7-9-11` vertex pyramid). First consumer `INNER_LADDER_MARKER`; built for Step 8.5/8.6 archetype-form reuse.
- **`formatRestRaw`** — a pure total formatter: a structured `RestSpec` → a readable string ("rest 90 sec between sets"); used for the derived `REST.raw` (in `onSubmit`) and the `SchemaRowCard` `REST` summary.
- Three `SchemaRowCard.renderBody` summary branches — `REST` (via `formatRestRaw`), `INNER_LADDER_MARKER` (the `" → "`-joined steps chain), `STANDALONE_URL` (the url as a plain `Chip` label — escaped text, not a live `href`). The `default` inert chip stays for the 5 still-unimplemented rowKinds.

**6 commits** (`c19c0725..1a41a453`, base the prompt commit `417e137a`): 3 `feat` per-layer atomic (chip-array + formatter / three row forms + registry / renderBody summaries + barrel) + 1 `fix` (`fe4bee40` — QA-902/903 hardening) + 1 `test` (`step-array-fields.test.ts` — `parseStepDraft` regression) + 1 `docs` (output report). 14 code files, all under `apps/platform/src/modules/plan-detail/components/`, +1101/−5 (10 new + `row-kind-form-registry.ts` +6 / `schema-row-card.tsx` +9 / `index.ts` +4 barrel / `standalone-load-row-form-schema.test.ts` registry-test correction). Single-package → every intermediate tree green under `turbo check-types --filter="...[HEAD]"`, no squash.

**Planner spot-check** (verbatim): `step-array-fields.tsx` — `parseStepDraft` is the strict `/^[1-9]\d*$/`-pattern parser (the QA-902 fix), `commitDraft` appends only on a non-`null` parse; **no `onBlur`** — Enter (`onKeyDown` + `e.preventDefault()`) + an explicit `<Button>Add</Button>` (the QA-903 fix, the `WeightSplitTierFields` precedent); `MIN_STEPS = 1` floor via `{...(isRemovable && { onDelete })}`; `error?` typed `Merge<FieldError, FieldErrorsImpl<number[]>>` (the D3 deviation — see below), no `as`. `format-rest-raw.ts` — `["rest", …].filter(len>0).join(" ")` guarantees a non-empty result; `formatDuration` exhaustive over `REST_DURATION_UNITS` with no `default`, no throw. `standalone-url-row-form.tsx` — `standaloneUrlRowFormSchema` is `{ url, appliesTo }` only (no `wrapped` key); `onSubmit` pins `wrapped: true` literally (D-9.2-3). `rest-row-form.tsx` — `onSubmit` builds `{ rowKind: "REST", parsed, raw: formatRestRaw(parsed) }` (D-9.2-4 — `raw` derived). `inner-ladder-marker-row-form.tsx` — `innerLadderMarkerRowFormSchema` `z.array(z.number().int().positive()).min(1)`. `row-kind-form-registry.ts` — 4 entries. `schema-row-card.tsx` — 3 new `renderBody` `case` arms, `STANDALONE_URL` → `<Chip label={url}>` (escaped text, no `href` — security). Type-discipline grep across the 5 source files — zero `any` / `@ts-` / non-narrowing `as`; the only `as` is `as const` on the three `onSubmit` payload literals. `[[type-quality]]` clean.

Verifications (executor + planner re-run): `check-types` 16/16 (planner re-ran FULL — 0 cached, 57s) · `lint` 16/16, 0 warnings (planner re-ran FULL — 0 cached) · `dep:check` 0 violations (1340 modules) · `vitest --project platform` 9 files / 140 tests (planner re-ran — baseline 64 → +76). Browser smoke (§ 9 — 11 steps) user-run + accepted 2026-05-22.

## Open questions resolved

### OQ-C3 (`STANDALONE_URL.wrapped`) — resolved from `analysis/` verbatim at thesis time

The 9.2 thesis flagged `wrapped` (a required `z.boolean()`) as a thesis-blocker — its semantics did not follow from `analysis/`. The user delegated the dig; the planner found the verbatim answer: `domain-model.md` § 1.6.5 (`wrapped — bool ([ URL ] vs bare URL)`) + `03-content/edge-cases.md` (the absence of bracket-wrapping is "**typo or styling, not semantic difference**"). `wrapped` is a non-semantic notation artifact — not a coach decision. Ratified as **D-9.2-3**: the form pins `wrapped: true` (the canonical bracket form, 50/52 occurrences), no UI control — the mirror of D-9.1-3. Flavour (b) `[[coach-pov-first]]` applied as intended — the semantics were read from the domain source, not invented.

### D-9.2-1..8 — all implemented exactly (Review confirmed point-by-point)

The three `*RowForm` mirror `StandaloneLoadRowForm`; `wrapped` pinned, `appliesTo` a `Select` (D-9.2-3); `REST.raw` derived via `formatRestRaw` (D-9.2-4); `INNER_LADDER_MARKER` a `.min(1)` chip-array, repeats allowed (D-9.2-5); `renderBody` +3 arms, `default` inert chip kept (D-9.2-6); platform-only (D-9.2-7); QA-305 / toast-policy not folded (D-9.2-8). `REST` default `scope` = `between_sets` (design D4 — a standalone rest row is not inside `n-rounds`; the § 0.4 standalone-`REST` fixture uses `between_sets`).

### Two design-doc deviations (both within ratified intent, recorded in `output.md`)

- **D3 — `StepArrayFields.error?` type.** `design.md` D3 specified `error?: FieldError`. Under `exactOptionalPropertyTypes: true`, RHF types an array field's error as `Merge<FieldError, FieldErrorsImpl<number[]>>` (where `type` is optional → not assignable to `FieldError`). Caught at implement-time as a real `TS2322`; corrected by widening the prop type to the precise RHF type — **no `as`**, behaviour unchanged (the component reads only `.message` / `!== undefined`). `design.md` D3 carried an inaccurate type claim; the code is correct. A `[[type-quality]]`-clean fix (the right type, not a cast).
- **D5 — chip commit gesture.** `design.md` D5 proposed Enter + blur-commit, no Add button. QA-903 found `onBlur={commitDraft}` over-commits — a leftover draft is appended on _any_ blur, including blur-to-Cancel and blur-to-delete-a-chip. Switched to an explicit **"Add"** button + Enter (blur-commit removed) — the `WeightSplitTierFields` precedent (pattern compliance); the parasitic-chip class is eliminated entirely.

### QA verdict B — 2 WARNING, both fixed in-pipeline

Stage 6 QA scored the diff **B** (0 CRITICAL / 2 WARNING / 5 INFO), every attack probe-executed against the project's real zod / `Number()`. Both WARNINGs were fixed by the executor in commit `fe4bee40` before close, and the planner verified the fixes verbatim:

- **QA-902** — `commitDraft` used `Number(draft)`, which is permissive (`Number("1e3") === 1000`, `Number("0x10") === 16`); `<input type="number">` _permits_ `1e3` as a live keystroke → a coach typing `1e3` got a silent 1000-rep chip. Fixed: a strict `parseStepDraft` (`/^[1-9]\d*$/` then `Number()`, else `null`) — exactly the QA recommendation. Regression-locked by `step-array-fields.test.ts` (19 tests, commit `1be19519`).
- **QA-903** — `onBlur={commitDraft}` over-committed (above). Fixed: the QA-preferred option — drop blur-commit, add an explicit Add button.

The 5 INFO are edge cases the executor correctly did not action — see Deferred.

Review APPROVE (0 CRITICAL / 0 WARNING / 3 INFO — INFO-1 a codebase-consistent missing return type, leave; INFO-2 a blur-ordering note made moot by the QA-903 fix; INFO-3 the request to log the D3 deviation — done in `output.md`).

## Deferred decisions / carry-forwards

New, recorded in `state/03-deferred.md` "Step 9.2 follow-ups":

- **QA-907 — `z.string().url()` accepts `javascript:` / `data:` / `file:` schemes (hard forward-risk for any clickable-URL step).** In 9.2 it is **harmless** — the `STANDALONE_URL` summary renders the url as a plain `Chip` label (React-escaped text, no `href`); QA verified XSS-safe by tracing the render path. But the moment a later step renders the URL as a live `<Link href>` (a plausible "open the demo video" convenience), an attacker-or-mistake `javascript:` URL becomes a script-execution / open-redirect vector. **Action — the future clickable-URL step MUST gate the url through a `safeHttpUrl` helper** (allowlist `http:`/`https:` only, `rel="noopener noreferrer"`).
- **QA-904 — `formatRestRaw` appends `setIndex` unconditionally** → a `{ scope: "between_sets", setIndex: 2 }` rest (contract-valid — `setIndex` is an independent `.optional()`) yields the mildly nonsensical "between sets 2". INFO, cosmetic — `raw` is non-empty and contract-valid. **Action when triggered**: optional polish — append `setIndex` only when `scope === "after_specific_set"` (a `formatRestRaw` 1-line condition + a `format-rest-raw.test.ts` update). Not blocking.
- **QA-905 — `steps` / chip values above `2^53` pass the form schema + the contract with silent precision loss** (INFO, theoretical — no realistic path to a 20-digit rep count). QA-201-adjacent (the param-bounds domain gap). **Action when triggered**: a domain cap (`MAX_REASONABLE_STEP`) folded into the QA-201 domain sub-step.
- **QA-906 — a `REST_SLOT` row's Edit menu item opens nothing** (the registry miss → `RowEditorModal` renders `null`). Pre-existing since 9.1 (the Edit menu item is unconditional) — not a 9.2 regression. **Action when triggered**: hide/disable the Edit `MenuItem` when `ROW_KIND_FORM_REGISTRY[rowKind] === undefined`, or let the EXERCISE/FOOTNOTE/etc. steps naturally fill the registry. Minor.
- **QA-908 — `DEFAULT_STEPS` / `DEFAULT_REST_PARSED` are shared module-level mutable references** handed to RHF `defaultValues`. Safe today (RHF deep-clones `defaultValues`; `commitDraft` builds fresh arrays) — the 9.1 `StandaloneLoadRowForm` does the same. Lowest priority; flagged for completeness.

Carried, unchanged: **QA-305** (the `useMemo(..., [entity])` edit-form refetch-clobber) — the three new `*RowForm` inherit the residual; codebase-wide UX-polish with 8.4 `SchemaCard` / 9.1 `SchemaRowCard`, not a 9.2 fix (D-9.2-8). **QA-001c** (concurrent-create P2002) / **QA-W2** (reorder race) — pre-shipped-hook carry-forwards, QA confirmed 9.2 does not worsen them. Toast-policy carry-forward — row mutations toast as-is.

## Analysis-artifacts touched

**None.** Step 9.2 is platform UI on a shipped backend — no domain-model or Prisma-schema change. The contract Zod, the Prisma schema and the seed are byte-identical. (`analysis/` was _read_ at thesis time to resolve OQ-C3 — `domain-model.md` § 1.6.5 + `edge-cases.md` — but not modified.)

## Smoke-test status

**Passed** — the user ran the § 9 browser scenario (11 steps: add-row menu → REST structured form → INNER_LADDER_MARKER chip-array → `.min(1)` floor → STANDALONE_URL url + appliesTo, no `wrapped` control → invalid-URL field error → reorder → edit → delete) and accepted 2026-05-22.

## Process note

**Validation verdict: clean.** All gates green (planner re-ran `check-types` 16/16 FULL, `lint` 16/16 FULL, `dep:check` 0, `vitest --project platform` 140/140); the planner spot-checked the load-bearing artifacts verbatim — the strict `parseStepDraft`, the `onBlur`-removed + Add-button chip editor, the total `formatRestRaw`, the pinned `wrapped`, the derived `REST.raw`, the 4-entry registry, the escaped-text `STANDALONE_URL` summary; type-discipline grep clean. Review APPROVE; QA verdict B with both WARNINGs fixed in-pipeline (`fe4bee40`) and verified verbatim. The browser smoke passed. Scope confined — 14 code files, all under `plan-detail/components/`; contracts / api-server / routes / Prisma / seed / `apps/admin` untouched. Step accepted.

**Planner-discipline note — OQ-C3 escalation worked as intended.** The 9.2 thesis hit a domain-semantics gap (`wrapped`) and did **not** invent an answer — it flagged OQ-C3 as a thesis-blocker with a hypothesis and a commitment to dig `analysis/`. The dig found the verbatim answer (`domain-model.md` § 1.6.5 + `edge-cases.md`'s "not semantic difference"), which became D-9.2-3. This is flavour (b) `[[coach-pov-first]]` operating correctly — a domain field with no remembered rationale sent the planner to the source of truth, not to instinct. The prompt § 0.4 carries the verbatim quotes so the executor saw the grounding.

**Planner-discipline note — the QA pipeline caught two reusable-primitive bugs the correctness review missed.** Stage 5 review scored A (correctness-clean); Stage 6 hostile QA found QA-902 / QA-903 — both coach-reachable silent-wrong-result UX bugs in the new `StepArrayFields` primitive, which is slated for Step 8.5/8.6 reuse. Both were fixed before close. Nothing here is a planner miss — the prompt § 5 adversarial pass did enumerate "chip-array — bad input" (QA-902 is the `Number()`-permissiveness sub-case of exactly that axis) and the executor's QA stage caught the specific mechanism. Recorded as a positive: the `/feature` QA stage is the safety net for reusable-primitive hardening, and it fired.

**Next planner action**: Step 9.3 — `EXERCISE` (atomic form) + `RepNotationEditor` + `SideEditor` + the exerciseForm picker shell — the largest single Step 9 sub-step, and where `PercentageReferenceEditor` gains the `other_exercise` scope and `toRestrictedReference` is deleted per the QA-307 hard prerequisite. See `state/04-next-action.md`.

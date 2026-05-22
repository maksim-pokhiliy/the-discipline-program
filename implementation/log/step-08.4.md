# Step 08.4 — the anchor: first coach-visible Schema editor (ArchetypePicker + Schema CRUD + amrap-flat / n-rounds forms)

- **Date**: 2026-05-22 (prompt written 2026-05-21; executor ran + close-out 2026-05-22).
- **Feature-dev artifacts**: `.feature-dev/1779382741/` (research / design / plan / review / qa / tasks — `/feature` full pipeline, 9 stages).
- **Prompt**: `implementation/step-08.4/prompt.md` (planner-written 2026-05-21; commit `e7e28487`; D-8.4-1..9 ratified upfront).
- **Output**: `implementation/step-08.4/output.md` (executor self-report — AC 1-9 MET; AC-10 browser smoke user-run + accepted 2026-05-22).

## Summary

The anchor of Step 8 — the first coach-visible Schema editor, end-to-end. A coach opens a block, taps "add schema", picks one of 34 archetypes grouped by family, fills its param form, and the schema renders as a card inside the block (drag-reorder / edit / delete, mirroring blocks). Two halves per the prompt:

- **Phase 0 — archetype read-path.** `lmsArchetypePlatformApi.list` (api-server) → `mapToArchetype` → `GET /api/platform/archetypes` → `createArchetypesAPI` → the `use-archetypes` `useQuery` hook. Mirrors the `lms/label` platform-read slice. `createSchema` needs the seed-generated cuid `archetypeId` and the picker needs `family` per archetype — this read-path supplies both. The prompt's Phase 0 was folded into Step 8.4 (not a separate enabler step) per the user's ratified choice — see D-8.4-1.
- **Phases 1-4 — `plan-detail` Schema editor UI.** `SchemaList` / `SchemaCard` / `AddSchemaButton` embedded in `BlockCard`; `ArchetypePicker` (all 34, grouped by family, zero availability logic); `SchemaEditorModal` (a thin dispatcher) + the `SCHEMA_PARAM_FORM_REGISTRY` of self-contained `*SchemaForm` components; the `amrap-flat` + `n-rounds` param forms; the reusable `RestSpecFields` sub-editor. Structurally mirrors the Block UI stack.

**6 per-layer atomic commits** (`ed386142..7f1b6cbd`, base the prompt commit `e7e28487`): 3 `feat` (api-server endpoint+mapper / platform read-path / schema editor UI) + 2 `fix` (WARN-1 mode-memoization / QA validation-feedback) + 1 `test` (archetype list exact-34-set + the Q-5 ordering-test fix). 27 files, +1572/−0, purely additive (19 new, 8 modified — 7 barrels/registries append-only, `block-card.tsx` +10 lines, `BlockCardProps` unchanged). Phase 0 additive → every intermediate tree green under `turbo check-types --filter="...[HEAD]"`, no squash (D-8.4-9).

**Planner spot-check** (verbatim): `mapToArchetype` — `name: archetypeNameSchema.parse(row.name)` is a genuine runtime narrowing (Prisma `String` → the 34-literal union, fail-fast on a malformed seed row), the codebase `.parse()` idiom, **not** a cast — `[[type-quality]]` clean. `SCHEMA_PARAM_FORM_REGISTRY` — `Partial<Record<ArchetypeName, React.FC<…>>>`, lookup yields `FC | undefined`, no `as`. `SchemaEditorModal` — thin dispatcher, `undefined` → `return null` (the no-op for an unimplemented archetype). `add-schema-button.tsx` — `useMemo<SchemaEditorMode | null>` for the `mode` object (the WARN-1 fix), no `!`. `block-card.tsx` — `<SchemaList>` embedded below the intensity/timeCap summary, `block.schemas`, no prop change. Contract Zod (`archetype-params.schema.ts`, `cap-spec.ts`, `schema.schema.ts`), the Prisma schema, the seed, `apps/admin` — not in the diff (acceptance #7). `pnpm check-types` 16/16 (planner re-ran, FULL — 0 cached, 1m19s).

Verifications (executor + planner re-run): `check-types` 16/16 · `lint` 16/16 (0 warnings) · `dep:check` 0 violations · `pnpm test` 132 files / 1701 tests · `db:reset`+`db:seed` clean (34 archetypes) · `archetype/platform.test.ts` 7/7. Browser smoke (§ 9 — 8 steps) user-run + accepted 2026-05-22.

## Open questions resolved

### Approach (A) — the registry of self-contained `*SchemaForm` components (Design-gate escalation, planner-ratified)

The prompt § 2 / § 3 (D-8.4-5) named `AmrapFlatParamsFields` / `NRoundsParamsFields` as fields-only components inside one form-owning `SchemaEditorModal` (a literal mirror of `BlockEditorModal`). The Design stage found this is **not type-safe**: a single `SchemaEditorModal` owning one `useForm`, dispatched at runtime through a `Record` of heterogeneous per-archetype form configs, erases the per-archetype `TFormData` generic — Rules of Hooks forbid a conditional `useForm`, and the `Record` lookup forces a non-narrowing `as` (`[[type-quality]]` violation). The executor escalated via `AskUserQuestion` at the Stage 2 gate; the planner ratified **approach (A)**: the registry is `Partial<Record<ArchetypeName, React.FC<SchemaParamFormProps>>>` of self-contained `*SchemaForm` components — each owns its `useForm` + form schema + `FormModal`; `SchemaEditorModal` becomes a thin dispatcher. The Block-stack form pattern (`FormModal` + `react-hook-form` + `zodResolver`) is preserved, relocated one level down into each `*SchemaForm`. **This is the template for Steps 8.5-8.20**: each adds one `*SchemaForm` file + one `SCHEMA_PARAM_FORM_REGISTRY` entry; `ArchetypePicker` is untouched.

This was a **prompt error** — § 2/§ 3 prescribed the `SchemaEditorModal`-owns-`useForm` shape without simulating the type under a runtime dispatch over heterogeneous form schemas. `BlockEditorModal` serves **one** fixed form and does not dispatch; `SchemaEditorModal` serves N — structurally a different problem, so the D-8.4-5 mirror belongs at the per-archetype-form level, not at the dispatcher. Flavour (i) `[[planner-lint-impact-trace]]` covers exactly this ("when prescribing a code shape, simulate the type/lint surface") — the planner did not apply it to the component-ownership shape. Caught cleanly at the Design gate via the executor's escalation protocol; no rework, ratified before any code.

### D-EXEC-1..7 + Q-1..5 (executor decisions, all resolved without further planner escalation bar approach A)

- **D-EXEC-3 / Q-3** — `mapToArchetype` `name` needs `archetypeNameSchema.parse(row.name)` (Design § 5.3.2 said all fields assign cast-free — true except `name`: Prisma `String` vs the contract's 34-literal union). Resolved with the `mapToSchema`/`mapToSchemaRow` `.parse()` narrowing idiom. Verified verbatim by the planner — a genuine narrowing, not a cast.
- **D-EXEC-4** — all 9 new `.tsx` components barrel-exported, the 2 non-component `.ts` files not — matches the existing `components/index.ts` convention (it already exports `EffortPercentField` etc).
- **D-EXEC-5** — `@repo/api-routes` carries only generic handler factories, no per-slice route definitions; the prompt § 6 "if it carries route definitions" conditional resolved NO; commit boundary 2 collapsed.
- **D-EXEC-6** — `n-rounds-form-schema.ts` extracted (the QA-204 validation wiring would have pushed `n-rounds-schema-form.tsx` over the eslint `max-lines` 300 cap) — design § 6.1 / review INFO-1 had already named it.
- **Q-2 / WARN-1** — both `*SchemaForm` re-sync via `useEffect(reset, [mode])`; `mode` was an inline object literal → new identity each render → the effect clobbered coach input on any week-query refetch. Fixed `3e8b89de` — `useMemo` the `mode` in both parents.
- **Q-5** — the net-new endpoint test's family-ordering assertion was a test bug (asserted JS-string alphabetical order; Prisma `orderBy` on a Postgres enum sorts by declaration order). Endpoint correct; test rewritten `7f1b6cbd` to assert contiguous family grouping + name-sorted rows.

### QA verdict C — severity re-assessment (planner-validated)

Stage 6 QA scored the diff **C** with 2 CRITICAL. The executor (D-EXEC-7 / Q-4) re-assessed both as WARNING and one WARNING as a non-issue; the user ratified the dispositions; the planner independently traced each at close-out and **concurs**:

- **QA-201 (param integers unbounded)** CRITICAL → WARNING — an unbounded integer persists but corrupts nothing; the contract schemas (`positiveInt`) are themselves unbounded and frozen (§ 2). Correct downgrade. → deferred (see below).
- **QA-203 / QA-209 (edit-mode `toFormData` downgrade)** CRITICAL → WARNING — the trigger (a malformed `n-rounds` row, `countForm: "range"` with `countRange` absent) is unreachable: `NRoundsSchemaForm`'s discriminated-union form schema always emits a complete branch. A latent defense-in-depth gap, not a live bug — but cheap + in-scope, so fixed anyway (`95f719e5`).
- **QA-202 (WARN-1 fix "incomplete")** WARNING → non-issue — the double-click race re-seeds the form at open-time, within the picker's ~225 ms close transition, before the coach types; while the modal is open the picker is closed and `pendingArchetype` cannot change. The mechanism trace holds.
- **QA-204 (no per-field validation feedback)** — a legitimate WARNING; a codebase-wide UX gap (`block-editor-modal` is equally thin), not an 8.4 regression. The user chose to fix it in 8.4 (`95f719e5`) — `fieldState.error` wired into every form field across all 3 forms.

The QA findings' traced mechanisms were sound; only the severity labels (CRITICAL implies live corruption/breakage — neither does) and one fix-prescription were disputed, each with a mechanism-level argument, not to dodge work — QA-203/204/205/206/208/209 + WARN-1 were all fixed regardless. Validation verdict: the re-assessment is correct.

## Deferred decisions / carry-forwards

New, recorded in `state/03-deferred.md`:

- **QA-201 — param integer upper bounds (domain-model follow-up).** `durationMin` / `count` / `countRange` / `repsPerSet` / RestSpec `value` / `rangeMax` are unbounded in the frozen contract; the 8.4 forms correctly mirror that (no invented `.max()`). Whether the domain wants ceilings ("max AMRAP duration / rounds / reps / rest") is a planner/coach call with no current spec citation — a real fix is a ratified contract change (`archetype-params.schema.ts` + `cap-spec.ts`) + `db:reset` + `analysis/` sync, a separate sub-step per the WORKFLOW.md domain-model change protocol. Not blocking; an unbounded integer persists cleanly. Concrete ceilings need grounding in `analysis/source/` ranges or a Denys consultation before speccing.
- **QA-204-adjacent — Block/Session/Day editor forms lack per-field validation feedback.** 8.4's schema forms now wire `fieldState.error`; `block-editor-modal` (and the session/day editors) do not. A minor UX-consistency gap — fold into the toast-policy `/feature small` or a separate UX-polish pass. INFO.

Pre-existing, unchanged: QA-001c (`lmsSchemaApi.create` P2002 under concurrent create), QA-B4 (`reorder` `retryOnP2034`), QA-023 (`block/admin.test.ts:406` flake — did not flake this run). Toast-policy carry-forward (D-8.4-8) — schema mutations toast as-is; the editor-wide policy change stays a separate `/feature small`.

## Analysis-artifacts touched

**None.** Step 8.4 is UI + a read-only endpoint — no domain-model or Prisma-schema change, so the WORKFLOW.md `analysis/` sync rules do not trigger. The contract Zod schemas, the Prisma schema, and the seed are byte-identical.

## Smoke-test status

**Passed** — the user ran the § 9 browser scenario (8 steps: create block → add schema → picker 34 → `amrap-flat` / `n-rounds` forms → reorder → edit → unimplemented-archetype no-op → delete) and accepted 2026-05-22.

## Process note

**Validation verdict: clean.** All gates green (planner re-ran `check-types` 16/16 FULL); the planner spot-checked the load-bearing artifacts verbatim — `mapToArchetype` `.parse()` narrowing, the `Partial<Record>` registry, the thin-dispatcher no-op, the `block-card.tsx` additive embed, the `useMemo` mode fix; the QA verdict-C re-assessment traced and concurred; scope confined (27 files, contract/Prisma/seed/`apps/admin` untouched). The browser smoke passed. Step accepted.

**Planner-discipline note — flavour (i) `[[planner-lint-impact-trace]]` miss, caught at the Design gate.** The prompt § 2/§ 3 prescribed `SchemaEditorModal` owning a single `useForm` and dispatching to fields-only `*ParamsFields` — a literal copy of the `BlockEditorModal` shape that does not survive a runtime dispatch over heterogeneous per-archetype form schemas (the type erases, forcing an `as`). Flavour (i) is exactly "simulate the type/lint surface of a prescribed code shape" — the planner applied it to the Zod-inferred form schemas (D-8.4-7 correctly flagged `archetypeRoundsSetsParamsSchema` as flat) but **not** to the component-ownership shape. The `/feature` Design stage is built to catch precisely this; the executor escalated via `AskUserQuestion` (the escalation protocol working as intended), the planner ratified approach (A) before any code, zero rework. The narrow lesson: flavour (i)'s "prescribed code shape" includes **component ownership / hook placement**, not only schema/lint shapes — when a prompt prescribes "component X owns the form", simulate the type under every dispatch path. Covered by the existing flavour (i) wording ("when prescribing a code shape, mentally simulate which rules / type shape"); recorded here, not memory-worthy as a new flavour.

**Process note — Phase 0 folded into 8.4 (D-8.4-1).** The archetype read-path was a genuine read-enabler (flavour (g) — surfaced at prompt-write when the verbatim `createSchemaSchema` read showed `archetypeId` is a cuid the front-end cannot know statically). The planner offered a separate enabler step (precedent: 7.3.5) vs folding it into 8.4; the user chose the fold. It shipped clean as Phase 0 — additive, per-layer atomic, no cross-package squash needed.

**Next planner action**: Step 9.1 — the SchemaRow body editor begins (STANDALONE_LOAD rowKind + LoadEditor composite + WeightEditor sub-composite). The schema cards 8.4 ships have empty bodies; Step 9 fills them. See `state/04-next-action.md`.

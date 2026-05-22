# Next planner action

> Concrete next-action handoff brief. Updated every close-out as the queue shifts.

## Status: Step 9.1 CLOSED 2026-05-22

The SchemaRow body editor begins — the schema body is fillable. Shipped: the `STANDALONE_LOAD` rowKind end-to-end, `LoadEditor` (5 kinds, `switch`-dispatch) + `WeightEditor` (8 variants, `switch`-dispatch) + `PercentageReferenceEditor` (2 scopes), the `LoadSummary` formatter, the self-contained `StandaloneLoadRowForm`, the row-kind dispatch infra (`ROW_KIND_FORM_REGISTRY` / `RowEditorModal` / `AddRowButton`), and `SchemaRowList` / `SchemaRowCard` embedded in `SchemaCard`. D-9.1-4 (`switch`-dispatch, not a `Record`-registry) implemented zero-escalation — the flavour-(i) lesson of 8.4 applied proactively. 6 commits `d6e770bf..4e4421ce` (30 code files, +2387/−0). Review APPROVE; QA verdict B (both WARNINGs planner-traced); all gates green (planner re-ran `check-types` / `lint` / `dep:check` / `vitest --project platform` FULL); browser smoke user-run + accepted. Full entry: [../log/step-09.1.md](../log/step-09.1.md).

**The coach can now**: create a plan → programme a block with schemas → **fill a schema body with `STANDALONE_LOAD` rows** (pick "standalone load" from the row-kind menu, set the load via the 5-kind / 8-variant editors). The other 7 coach-facing rowKinds are no-ops in the menu — Steps 9.2-9.9 implement them.

## Next planner action: Step 9.2 thesis cycle — REST + INNER_LADDER_MARKER + STANDALONE_URL rowKinds

Per [01-step-queue.md](01-step-queue.md) Step 9.2: **3 simple rowKinds in one batch.** `REST` reuses the `RestSpecFields` sub-editor shipped in 8.4. Each new rowKind = one `*RowForm` file + one `ROW_KIND_FORM_REGISTRY` entry + one `SchemaRowCard` body-summary branch — the 9.1 row-form pattern is the template (the registry mirror of the 8.4 archetype-form pattern). `/feature` — full vs small is a thesis-time call (3 forms + a chip-array editor + 3 summary renders leans full; planner decides at thesis).

**This is a full executor-session step** — write `prompt.md` → fresh executor session → `output.md` → planner validates.

**Walkthrough gate (9.2).** The thesis coach view carries the queue's walkthrough as its base: Денис adds a `REST` row between exercises ("90 sec rest") — fills the structured rest fields (duration + placement), the row renders a rest annotation. Then an `INNER_LADDER_MARKER` — a chip-array "[10, 8, 6]" (a ladder-step marker for an associated exercise row). Then a `STANDALONE_URL` for a warm-up video — a url field + a "wrapped" toggle + an "applies to" dropdown. Three small forms, the same add-row menu, the same `SchemaRowCard` body.

**Thesis OQ surface (9.2's to ratify — hypotheses):**

- **`REST` payload — `raw` + `parsed` dual.** _Hypothesis:_ the `REST` payload is `{ rowKind: "REST", raw: string, parsed: restSpec }` (verbatim `schema-row.schema.ts`). The coach fills the **structured** `parsed` via the reused `RestSpecFields` (8.4); `raw` is **not** a free-text field the coach types — it is derived as a human-readable string from `parsed` (a small formatter), since for a coach-created row there is no source text to preserve (the `analysis/` § 1.4 `raw` — "- 90 sec rest in between sets -" — is an xlsx-inventory artifact, not a coach input). Confirm: coach edits structured, `raw` is derived.
- **`INNER_LADDER_MARKER` — a chip-array number editor.** _Hypothesis:_ `steps: z.array(z.number().int().positive()).min(1)` — a chip-array input (type a number → a chip, remove a chip). This is the **first chip-array editor** in the codebase; Step 8.5 (Ladder family) needs the same shape — 9.2 should ship it as a reusable chip-array number editor (the composite-VO ship-with-first-consumer principle). Confirm reusability scope.
- **`STANDALONE_URL` — a trivial flat form.** _Hypothesis:_ `{ url: z.string().url(), wrapped: z.boolean(), appliesTo: urlAppliesToSchema }` — `url` `TextField` + `wrapped` `Switch` + `appliesTo` `Select` (2 values — `previous_exercise_row` / `whole_schema`). No discriminated dispatch, no nesting — the simplest of the three.
- **`SchemaRowCard` body-summary extension.** _Hypothesis:_ `SchemaRowCard.renderBody` currently switches `STANDALONE_LOAD → LoadSummary`, `default → inert kind chip`. 9.2 adds three branches (`REST` / `INNER_LADDER_MARKER` / `STANDALONE_URL` summaries — the `LoadSummary` formatter precedent); the `default` inert chip stays for the still-unimplemented rowKinds.
- **Read-surface (flavour g).** _Hypothesis:_ no read-enabler owed — `SchemaWithBody.rows` is in the type (8.3.5), the `use-schema-rows` hooks + the `SchemaRowList` render path are shipped (9.1). 9.2 is platform-only, additive.

**Reference points to read at 9.2 prompt-write time:**

- `apps/platform/src/modules/plan-detail/components/` — the **Step 9.1 row-editor stack** (`schema-row-list`, `schema-row-card`, `row-editor-modal`, `row-kind-form-registry`, `add-row-button`, `row-editor-types`, `standalone-load-row-form`, `load-summary`) — the canonical row-form + registry + summary precedent.
- `rest-spec-fields.tsx` — the `RestSpecFields` sub-editor (8.4), reused verbatim for `REST.parsed`.
- `implementation/step-09.1/{prompt.md, output.md}` + `log/step-09.1.md` — the immediate precedent (the row-form pattern, DD-2..5, the QA dispositions).
- `packages/contracts/src/entities/lms/schema-row/schema-row.schema.ts` + `schema-row.constants.ts` — the `REST` / `INNER_LADDER_MARKER` / `STANDALONE_URL` payload members + `URL_APPLIES_TO`.
- `packages/contracts/src/entities/lms/_shared/cap-spec.ts` — `restSpecSchema` (the `REST.parsed` shape).
- `analysis/artifacts/06-formalization/implementation-notes.md` § 1.4 — the `REST` / `INNER_LADDER_MARKER` / `STANDALONE_URL` row-payload fixtures (flavour (b) — cite verbatim).

## Carry-forwards into the 9.2 thesis

- **QA-305** (`03-deferred.md` "Step 9.1 follow-ups") — the `useMemo(..., [entity])` edit-form refetch-clobber. 9.2's three `*RowForm` components carry the same `useEffect(reset, [mode])` + `SchemaRowCard`-`useMemo`-d-mode shape — they inherit the residual, **not** a 9.2 regression; do not fold a fix (codebase-wide UX-polish, with 8.4 `SchemaCard`).
- **Toast-policy** (`03-deferred.md` "Step 8.3 follow-ups") — 9.2's row mutations toast via `useWeekMutation` as-is; not folded.
- **QA-307 / QA-301** — Step 9.3 / domain follow-ups; **not 9.2 scope** (9.2 touches no `percentage` / `LoadEditor` surface).

## Process reminders (active)

- Thesis = two voice-coded sections (coach view + developer view) per `[[thesis-format]]`; the coach view carries the mandatory walkthrough per `[[coach-walkthrough-gate]]`, screen-only per `[[coach-daily-ux-priority]]`. 9.2 is coach-facing — the walkthrough is real.
- Prompt spec-only per `[[planner-strategic-level]]` — § 0 verbatim quotes; no prescriptive new-code skeletons in § 3.
- Flavour (a) `[[scope-via-existing-patterns]]` — the 9.1 row-editor stack is the canonical reference; read it verbatim in § 0. Flavour (b) `[[coach-pov-first]]` — the `REST raw`-vs-`parsed` semantics + `INNER_LADDER_MARKER steps` cite `analysis/` § 1.4 verbatim. Flavour (c) `[[planner-verbatim-registration]]` — `components/index.ts` is now **56 exports** (34 + 22 from 9.1); re-Read verbatim at prompt-write. Flavour (g) `[[planner-read-surface-trace]]` — confirm no read-enabler owed (it is not — 9.1 shipped the render path).
- `/feature` (full vs small — planner picks at thesis), `feat/training-domain` long-lived branch, branch-cut override mandatory (`[[always-via-feature-skill]]`).
- The next PR batches the post-#202 work (Step 9.x) — the planner does not open it unprompted (`[[execute-requested-outward-ops]]` — on the user's explicit request, act immediately). 7 commits currently sit local on `feat/training-domain`.

## After Step 9.2 close-out

Per [01-step-queue.md](01-step-queue.md) execution order: 9.2 → **9.3** (EXERCISE atomic + RepNotation + Side + exerciseForm picker — the largest single sub-step, and where `PercentageReferenceEditor` gains the `other_exercise` scope + `toRestrictedReference` is deleted per the QA-307 hard prerequisite) → **9.4-9.11** → **8.5-8.20** archetype expansion → 10.

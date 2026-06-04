# plan-editor-compose — decisions

D-numbered ratified decisions for this initiative. Step-level calls that don't merit a full ADR live here; the one cross-initiative call is `docs/adr/0037`. **Promote here at every gate** — a decision that lives only in gitignored `.feature-dev/` or an external chat is not durable (this file is the SSOT for "why").

**Status legend:** `RATIFIED` (decided + acted) · `OPEN` (awaiting user ratification — do not execute past it) · `SUPERSEDED` (replaced — kept for the trail).

**Legitimacy lens for any primitive/axis decision:** FOUR-PROJECTION INVARIANCE — a primitive is legitimate iff it means the same thing across (1) coach SETS, (2) athlete EXECUTES, (3) RENDER, (4) ANALYTICS. If it splits into "depends what was meant" in any projection, it is a name-collision, not a primitive, and must be split before the contract freezes it. Memory: `[[compose-four-projection]]`.

## Index

| ID                 | Topic                                                                                          | Status                                       |
| ------------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------- |
| D-PIVOT            | Compose-only model; archetype emergent                                                         | RATIFIED (ADR-0037)                          |
| D-INTERVAL         | `interval` is a `repetition` primitive                                                         | RATIFIED (10.2)                              |
| D-LADDER           | `ladder` splits → container-axis vs row-payload                                                | RATIFIED (10.2 §B)                           |
| D-CADENCE          | `cadence`/`interval`/`window` are distinct                                                     | RATIFIED (10.2 §5.3)                         |
| D-EMOM-SLOT        | EMOM sub-minute slot = row-level `slotSpecSchema`, no new axis                                 | RATIFIED (10.2 §F.3)                         |
| D-EMOM-UX          | EMOM "row-as-minute" derived view (UX, computed-on-read)                                       | RATIFIED principle → S2 requirement          |
| D-CONTAINER-VS-ROW | Container ⇔ carries repetition OR >1 movement; else row                                        | RATIFIED principle → S2 + basis for D-10.4-2 |
| D-PERSIST          | Composition persists flat per-node; nesting stays on `parentSchemaId`                          | RATIFIED (10.2)                              |
| D-STRICT           | `.strict()` on the axis contract                                                               | RATIFIED (10.2 Gate-B)                       |
| D-DUALWRITE        | Composition optional / archetype required (Option C)                                           | RATIFIED (10.3 DEC-1)                        |
| D-LABEL            | `deriveCompositionLabel` computed-on-read, compose-native enum, never stored                   | RATIFIED (10.3 DEC-2)                        |
| D-SEED             | Seed = Gauntlet-port, additive (10.3) → composition-native (10.4 S3)                           | RATIFIED (10.3 DEC-3)                        |
| D-UNTILREC         | `until_recovery` sham `{value:1,unit:"sec"}` kept                                              | RATIFIED (10.3 DEC-4)                        |
| D-SCORING-INERT    | Scoring-inert source-scan guard re-homed to api-server                                         | RATIFIED (10.3 DEC-5)                        |
| D-ALTGROUP-FOLD    | `AlternatingGroup` → `arrangement:parallel`, preserving `setEnumeration`/N-ary                 | RATIFIED (target frozen 10.2)                |
| D-AG-FACTS         | AlternatingGroup domain facts the fold must preserve (migrated from `implementation/`)         | RATIFIED (history)                           |
| D-D4-REVERSAL      | The 34-archetype catalog-as-seeded-config is DROPPED by 10.4                                   | RATIFIED (reverses old D4)                   |
| D-PHASE5-SCORING   | Scoring/execution layer = the product differentiator vs Sheets; deferred to its own initiative | DEFERRED (future initiative)                 |
| D-10.4-1           | 10.4 shape: the arc S1→S2→S3 vs alternatives                                                   | RATIFIED (S1)                                |
| D-10.4-2           | Drop `Schema.kind` + abolish the kind-based write guards                                       | RATIFIED (dir; S1 nullable → S3 drops)       |
| D-10.4-3           | S2 compose-write UI scope (full four-projection vs MVP)                                        | RATIFIED (S2 kickoff 2026-06-04)             |
| D-10.4-S1-RS       | S1 read-shape fork → option (b): non-null read + `mapToSchema` narrow                          | RATIFIED (S1 Gate A)                         |
| D-10.4-S1-INT      | S1 ships composition-only-create as an accepted poison-intermediate                            | RATIFIED (owner override)                    |
| D-10.4-S2          | S2 Run-1 calls: cascade partial-failure, converter shape, persistence loc, FK + philosophy     | RATIFIED (S2 Run-1; PR #242)                 |
| D-10.4-S2-R2       | S2 Run-2 calls: arrangement authoring + two-phase ref persist + QA-004 + property test         | RATIFIED (S2 Run-2; PR #244)                 |

---

## Pivot

### D-PIVOT — Compose-only plan-content model; archetype is emergent

- **Status:** RATIFIED — `docs/adr/0037`.
- **Decision.** Replace the 34-archetype catalog + picker-first authoring with a small set of freely-nesting primitives. "Archetype" becomes a computed-on-read label, never a stored entity. Acceptance = expressiveness (any paper structure composes), not "covers N archetypes."
- **Origin.** Web-Claude exploration (2026-06-02) → blind Gauntlet stress test → ADR-0037. The methodology (four-projection) was derived there; the durable record is the ADR + `[[compose-four-projection]]` + this file.

## Algebra primitives (the four-projection resolutions)

### D-INTERVAL — `interval{workMin,offMin,count}` is a `repetition` primitive

- **Status:** RATIFIED (10.2). Frozen in the contract.
- **Rationale (four-projection).** Coach sets a work:rest ratio as one concept (Tabata 20:10); athlete runs a continuous timer duty-cycle (≠ discrete rounds); analytics needs the ratio as a first-class measurable (un-recoverable from a smeared `count`+`timeCap`+`rest`); render = work/rest bar. The earlier "is it just count+timeCap+rest?" framing was withdrawn — that encoding preserves the numbers but loses the concept in all four projections.

### D-LADDER — `ladder` splits into TWO primitives on two node levels

- **Status:** RATIFIED (10.2 §B). Frozen + a four-projection test pins it.
- **Decision.** Round-counter ladder = `container.repetition.ladder.steps` (a Container axis; Fran 21-15-9 over two movements, shared counter). Rep-scheme ladder = `row.rowPayload.steps` on the existing `INNER_LADDER_MARKER` row variant (Block C `21-15-9 ‖ 9-15-21`, per-track personal scheme).
- **Rationale.** As one primitive, `steps` collides in the analytics projection — Fran derives per-movement reps from a shared counter, Block C from per-track schemes (one field, two computation paths). Splitting onto two node levels resolves it: different fields on different node types, one source per case. The web-Claude "likely RepNotation" hypothesis was OVERRIDDEN in favour of the existing `INNER_LADDER_MARKER` marker (keeps the sacred leaf untouched).
- **Consequence (the QA-001 collision).** A container with `repetition:ladder` AND an `INNER_LADDER_MARKER` row child is the forbidden fused shape — the exact thing the split kills. Enforced by a `composeContainerSchema.superRefine`. This is the collision the 10.4 write-guard must reject at write time (see `deferred.md` QA-001).

### D-CADENCE — `cadence` / `interval` / `window` are three distinct repetition primitives

- **Status:** RATIFIED (10.2 §5.3).
- **Decision.** `cadence{everyMin,rounds,totalMin?}` = EMOM start-gun ("every N min a new round begins"). `interval` = work/off duty-cycle (explicit off-duration). `window{startHhMm,endHhMm}` = a child time-box (clock span of an enclosing cadence/interval). All three pass four-projection individually.
- **Note.** Resolves the §A.4 name-collision the design caught: `window` as "1-minute duration" vs "clock interval of day" — kept as clock-range; EMOM per-minute boxing is `window(1min)` children under a cadence parent.

### D-EMOM-SLOT — EMOM sub-minute slot = row-level `slotSpecSchema`, NOT a new axis

- **Status:** RATIFIED (10.2 §F.3).
- **Decision.** The legacy `emom-sub-minute-slot` `slotSpec` is a row-payload concern (which minute(s) a slotted exercise occupies); reuse `_shared/cap-spec.ts` `slotSpecSchema` at the row level. No new composition axis — `repetition:window` already covers per-minute boxing.

### D-EMOM-UX — "row-as-minute" is a derived render view (UX, computed-on-read)

- **Status:** RATIFIED as principle → **S2 requirement** (was generated in the web-Claude smoke-test discussion, scoped "10.3 render"; 10.3 shipped backend-only, so it is UNBUILT and lands in S2). Promoted here from the chat export — durable nowhere else before this.
- **Decision.** A coach thinks "in an EMOM each row is a minute." The MODEL stays neutral (a row is a row; meaning comes from the parent's `cadence`). The UX projects: when the parent carries `cadence`, flat child rows render as `MIN 1/2/3/4` (a derived view, like `deriveCompositionLabel` — computed-on-read, never stored). Default reading of N flat rows under `cadence` = N minutes; promote a minute to a slot-container when it holds >1 movement (see D-CONTAINER-VS-ROW). The model holds both readings; the UX picks the default by parent context.
- **Why model-not-UX.** Baking "row = minute" into the model loses the dense-EMOM reading (several movements per minute) and re-introduces a context rule as a hard type. The model holds possibilities; the UX imposes interpretation.

### D-CONTAINER-VS-ROW — the structural invariant that replaces `kind`

- **Status:** RATIFIED as principle → drives S2 + is the basis for D-10.4-2. Promoted from the web-Claude export.
- **Decision.** A unit is a **Container** iff it carries its own repetition-semantics OR holds >1 movement; otherwise it is a **Row**. Applied deterministically (not on taste). This is the single rule from which ladder-placement, EMOM-slot, and "4 flat rows under cadence" all fall out — it is the structural discipline that the dropped `Schema.kind` guards used to (crudely) encode. In the compose model "any container accepts any child" (algebra §2.4) — so the discipline is a UX affordance (S2 guides row↔container), not a stored discriminator or a write-time reject.

## Contract / persistence

### D-PERSIST — composition persists flat per-node; nesting stays on `parentSchemaId`

- **Status:** RATIFIED (10.2). `Schema.composition Json?` stores ONE node's axes; the mapper assembles the recursive read-projection (like `schemaWithBodySchema`). Keystone-trap avoided: the contract never stores the recursive blob.

### D-STRICT — `.strict()` on the axis contract

- **Status:** RATIFIED (10.2 Gate-B). Unknown keys reject (not silent-strip) so a mapper typo on an optional field fails loud.

## Backend / seed (10.3)

### D-DUALWRITE — composition optional / archetype required (Option C)

- **Status:** RATIFIED (10.3 DEC-1). Forced by the FK reality (`archetypeId` required, `onDelete:Restrict`). Every created/seeded Schema carries both until 10.4 drops the archetype side.

### D-LABEL — `deriveCompositionLabel` computed-on-read, compose-native enum, never stored

- **Status:** RATIFIED (10.3 DEC-2). Pure fn in `@repo/contracts/lms/composition`; 9-kind/7-family compose-native enum (NOT the 34 archetype names — that would re-impose the masked taxonomy). A grep-test proves no stored `kind`/`family` column (OQ-1 guardrail).

### D-SEED — seed = Gauntlet-port additive (10.3), becomes composition-native (10.4 S3)

- **Status:** RATIFIED (10.3 DEC-3). 10.3 attached 5 Gauntlet composition trees additively. 10.4 S3 converts the seed to composition-native (drops archetype catalog + the 34-archetype coverage gate). See `10-4-recon.md` §SEED.

### D-UNTILREC — keep the `until_recovery` sham

- **Status:** RATIFIED (10.3 DEC-4). `{duration:{value:1,unit:"sec"},qualifier:"until_recovery"}`. Tightening it (a `restSpecSchema.superRefine` pinning `value:1`) is a frozen-contract change → deferred (see `deferred.md`).

### D-SCORING-INERT — scoring-inert source-scan guard re-homed to api-server

- **Status:** RATIFIED (10.3 DEC-5). `scoring-inert-consumers.test.ts` scans the api-server consumer surface; survives 10.4's deletion of the UI `compose/` guard.

## AlternatingGroup fold

### D-ALTGROUP-FOLD — `AlternatingGroup` → `arrangement:parallel`, preserving relation data

- **Status:** RATIFIED (target frozen 10.2). The fold target: `arrangement.parallel.tracks:[{childSchemaId, setEnumeration?, pairedWithRowId?}]`. No data migration (no users; `db:reset` + re-seed re-expresses alternating-sets blocks as `arrangement:parallel`). The fold is a representation refactor — the relation data moves into the axis, it is not deleted.

### D-AG-FACTS — AlternatingGroup domain facts (migrated from `implementation/state/02-decisions.md`)

- **Status:** RATIFIED (history; migrated so 10.4 does not depend on the superseded dir).
- **D14** — `AlternatingGroup` is an **N-ary** relation (2..N schemas linked into one alternating cycle, no upper bound beyond `.max(24)`), not a 2-FK pair.
- **D-A5** — `setEnumeration` tiling (`[1,3,5]`/`[2,4,6]`) is NOT API-enforced (coach editorial responsibility; surfaced later as a soft warning).
- **D-A6.1** — archetype homogeneity: every member was `archetype.name === "alternating-sets"`. Post-fold this becomes "every track is a parallel sibling" — the homogeneity constraint dissolves into the axis.
- **C-A1** — no member-order column; alternation sequence lived in `setEnumeration` + render order `Schema.order`. The fold's `tracks[]` order + `setEnumeration` carry this.

### D-D4-REVERSAL — the 34-archetype catalog-as-seeded-config is dropped by 10.4

- **Status:** RATIFIED (reverses old `implementation/` D4).
- **Old D4** held: "Archetype is configuration — 34 canonical entries MUST be seeded; `archetypeParamsSchema` lives in the DB for patch-without-redeploy; no admin CRUD." 10.4 reverses this: the `Archetype` table + the catalog seed + the "34 referenced" coverage gate all die; structure is now compositional, not catalog-driven.

---

## 10.4 forks — S1 ratified (D-10.4-1/2 + two S1 calls); D-10.4-3 deferred to S2

### D-10.4-1 — 10.4 shape: the arc S1 → S2 → S3

- **Status:** RATIFIED (2026-06-04). The arc. S1 shipped (PR #241); S2 next.
- **The constraint (proven, not preference).** Removing archetype removes the only authoring path (picker + 18 forms + `SchemaEditorModal`). The replacement — the compose-write UI — exists as a walkthrough-validated mock prototype but does NOT persist (zero mutation wiring, local types ≠ frozen contract, no draft→`Composition` converter — verified). So the destructive cut cannot complete until the prototype is productionized.
- **Recommended arc.** S1: QA-001 write-guard + nullable-archetype expand (api-server, ~1 session). S2: productionize the validated prototype — converter + persistence + type-alignment + mounts + coach re-walkthrough (UI-first `/feature`, ~1 session). S3: mechanical sweep — delete old authoring → render-flip → seed composition-native → contract/api-server archetype removal → Prisma drop + `db:reset` (ultracode workflow, ~1 session). ~3 sessions, 2 gated DB runs.
- **Alternatives.** (a) UI as a separate initiative, 10.4 = guard + expand + seed only (minimal destruct now). (b) Sweep with a placeholder-archetype dual-write (faster to clean schema, but placeholder = archetypeId-reincarnation risk, violates OQ-1).

### D-10.4-2 — drop `Schema.kind` + abolish the kind-based write guards

- **Status:** RATIFIED (direction, 2026-06-04) — drop + abolish. S1 made `kind` NULLABLE as the stepping stone (the kind-consuming guards `assertParentKindForRow`/`assertSubSchemaInvariants` + the two ownership guards are now null-tolerant, behavior-preserved for non-null); **S3** drops the column + abolishes the two assertions.
- **Finding.** `kind` is NOT a pure-archetype field — `assertParentKindForRow` ("no rows on NESTED") + `assertSubSchemaInvariants` ("sub-schema only ATOMIC/HEADERLESS under NESTED") consume it at write time, and the ownership guards return it. Algebra §2.4 ("any container accepts any child") abolishes these restrictions; the structural discipline moves to the S2 UX (D-CONTAINER-VS-ROW), not a stored discriminator.
- **Behavior change (flagged).** Post-drop a coach can put a row in a grouping container. This follows from the ratified algebra; it touches the authz-guard result contract (the returned `kind`/`schemaKind` lose their only consumers — the two assertions that also die).
- **Alternative.** Retain `kind` (stored or computed) + the guards — safer for current behavior, but a vestigial archetype-era field, contradicts the spec's "kind computed-on-read, not stored."

### D-10.4-3 — S2 compose-write UI scope

- **Status:** RATIFIED (S2 kickoff, 2026-06-04). Ratified the recorded leaning verbatim.
- **Decision.** S2 end-state = **full four-projection-faithful** (all axes, incl. `arrangement:parallel/superset`) — non-negotiable: without parallel/superset the coach re-walkthrough cannot close Gauntlet C (parallel ladders) / E (supersets). **parallel/superset authoring + QA-004 existence-check are sequenced LAST within S2** — both the hardest piece and the cleanest cut-line: if the productionization research shows S2 overflows one `/feature` full, parallel/superset slips to an S2 increment (next session), QA-004 rides with it (inert until arrangement refs are authored → no poison), and the re-walkthrough validates the shippable subset honestly with C/E arriving on the increment. **The split decision itself is delegated to the `/feature` research stage** (it owns the productionization blast-radius); not pre-committed here (would be instinct-specing).
- **The fork (kept for the trail).** The prototype HAS all 7 repetition fields + arrangement/scoring/rest inspector (UX validated). The scope question was: ship ALL axes incl. `arrangement:parallel/superset` (refs `childSchemaId`/`rowIds`/`pairedWithRowId` + the AlternatingGroup fold + the QA-004 existence-check) day-1, or simple axes first (count/ladder/cadence/interval/timeCap + ordered + duplication + EMOM row-as-minute) and defer parallel/superset persistence to an increment. Resolved: full end-state, parallel/superset sequenced last.
- **Coach-POV.** The corpus uses parallel ladders (Gauntlet C) and supersets (E) on paper — so for fidelity they are needed; the question was day-1 vs increment, resolved in favour of fidelity-with-late-sequencing.

### D-10.4-S1-RS — S1 read-shape fork → option (b)

- **Status:** RATIFIED (S1 Gate A, 2026-06-04).
- **Decision.** Making the Prisma archetype columns nullable forces `mapToSchema` to read `SchemaKind | null` etc., which doesn't fit the non-null read contract `schemaSchema`. Two resolutions: **(a)** widen `schemaSchema`/`SchemaShape.{kind,archetypeId,archetypeParams}` to nullable — but `turbo check-types` fans out (`^check-types`), so this type-breaks ~6 platform read sites IN-GATE, all doomed code S3 deletes; **(b)** keep the read contract non-null; `mapToSchema` narrows the nullable Prisma columns with a runtime `if (x === null) throw InternalServerError(DbCorruption)` (no `!`/`as`). Chose **(b)**.
- **Rationale.** Smallest reversible change; platform stays untouched (its consumers are rewritten in S2 anyway); no throwaway null-guards in an api-server step. The write-side null-tolerance (ownership guards return `| null`; `assertParentKindForRow`/`assertSubSchemaInvariants` null-tolerant; `assertArchetypeConsistency` caller-gated; `createSchemaSchema` triad optional + all-present-or-all-absent `superRefine`, base-object pattern so `updateSchemaSchema.partial()` still derives) is needed under BOTH (a) and (b) — the fork is ONLY the read RESPONSE shape.
- **Consequence → S2 (DR-1).** Defers the read-shape widen + the ~6 platform null-guards to S2. Full design lived in the S1 `/feature` `design.md` §6.1; obligation is `deferred.md` DR-1.

### D-10.4-S1-INT — S1 ships composition-only-create as an accepted poison-intermediate

- **Status:** RATIFIED (owner override, 2026-06-04).
- **The finding (Review REVIEW-001 + QA-101/102 — independent, offline-proven).** `createSchemaSchema`'s now-optional triad means the contract ACCEPTS a composition-only create (`{ blockId, composition }` or even `{ blockId }`), and nothing in the handler gates it. Such a create PERSISTS, then `mapToSchema` (option-b narrow-guard) 500s on read-back → the whole week read 500s until `db:reset`. Plus the write-guard inverts to 500 (not 400) on a composition-only parent (hooks route through `mapToSchema`). API-only (no S1 UI path emits composition-only creates).
- **Decision.** Do NOT gate it in S1. Ship the poison-intermediate as-is.
- **Rationale (owner).** Migration errors mid-process are normal; the code is LOCAL, won't be pushed/merged broken; "это ПРОЦЕСС, не результат." The ~10-line `if (archetypeId == null) throw` gate I recommended was declined — not worth fussing over an API-only, `db:reset`-recoverable intermediate that S2 closes anyway. (Co-ownership note: I held the line once — week-bricking poison + a guard-contract inversion ≠ mere UI lag — then complied on contentful pushback.)
- **Closes in S2 (DR-1).** S2 widens the read shape + enables the composition-only handler path together → the poison window ends. Until then: do NOT create composition-only schemas via the API. **(CLOSED — S2 Run-1, PR #242: read widened + mapper guard dropped + 24 null-guards; gated round-trip + coach re-walkthrough verified.)**

### D-10.4-S2 — S2 Run-1 productionization calls (cascade, converter shape, persistence, FK, philosophy)

- **Status:** RATIFIED (S2 Run-1, 2026-06-04; PR #242). Implementation decisions distilled from the `/feature` run's `.feature-dev/1780559503/{design,review,qa}.md` (gitignored) so they survive durably.
- **DR-2 — cascade partial-failure = sequential, stop-on-first-failure, leave the partial, surface it (NO auto-rollback, NO bulk endpoint).** A compose block persists as N sequential per-node creates (no transactional tree endpoint exists). A mid-cascade failure leaves a visible partial tree the coach can see + delete/re-save. Rationale: single-coach non-prod; the converter validates the WHOLE tree pre-network (`compositionSchema.safeParse`), so the realistic mid-cascade failure is the rare QA-001 ladder collision — visible + fixable. Saga-rollback and a transactional bulk endpoint (**DR-3**) both add complexity/scope disproportionate to a UI-first increment → **DR-3 explicitly DEFERRED** (revisit only if real-use latency / partial-tree friction surfaces).
- **Converter shape = a plan-tree of `Omit<CreateSchemaRequest,"blockId"|"parentSchemaId">` nodes** (not a flat list, not a recursive blob). The `Omit` is a TYPE-LEVEL guarantee draft UUIDs can never reach the `.cuid()` ref fields; the persistence walk supplies server cuids parent-first. **Root container = the Block, NOT a Schema** — top-level children carry `blockId`, nested carry `parentSchemaId`; the frozen `createSchemaSchema` requires `blockId`, so nested creates send BOTH and the route scopes by `parentSchemaId`.
- **Persistence = app-local `useCreateSchema`/`useCreateSchemaRow` (`apps/platform/src/lib/hooks`), NOT `@repo/query`.** The S2 brief said "@repo/query" — a location drift; `@repo/query` exposes only the factory/primitives. The QA-001 400 toast is inherited via the existing `useWeekMutation → notifyError`.
- **FK reality (resolves DR-1's crux):** a composition-only create writes `archetypeId: null`; `onDelete:Restrict` is inert for a null FK, so no Archetype row is needed. S1 already made the Prisma triad nullable + the handler writes `?? null` → composition-only persistence works with NO Prisma change; DR-1 "step 4 enable handler" was confirm-only.
- **EMOM-UX + container↔row shipped** ([[D-EMOM-UX]] / [[D-CONTAINER-VS-ROW]]): `deriveMinuteView` (computed-on-read, never stored, mirrors `deriveCompositionLabel`) + a non-blocking inspector demote hint. The structural promote/demote BUTTON is DEFERRED (needs inspector-API expansion — carry-forward).
- **Migration philosophy (owner directive 2026-06-04):** aggressive in-place — no preventive guards, no hiding, broken OLD/peripheral paths acceptable; floor = compile+lint green per commit (husky stays, no bypass). Drove: Task 8 (hide parallel/superset options) DROPPED — they break honestly on Save via the frozen-schema reject; the old archetype edit path left to degrade on composition-only (S3 removes it). This is [[migration-intermediate-velocity]] intensified.
- **Links:** [[D-10.4-3]] (scope), DR-1 (`deferred.md`, CLOSED), `10-4-recon.md` §MINE-2. Verified: gated api-server `week/admin` composition-only round-trip + coach re-walkthrough PASSED 2026-06-04.

### D-10.4-S2-R2 — S2 Run-2 productionization calls (arrangement authoring, two-phase ref persist, QA-004, property test)

- **Status:** RATIFIED (S2 Run-2, 2026-06-04; PR #244). Distilled from the `/feature` run's `.feature-dev/1780577040/{design,review,qa}.md` (gitignored). Discharges D-10.4-3's parallel/superset obligation → the four-projection end-state is reachable; **S3 is unblocked.**
- **Ref-wiring UX = SELECTION over existing descendants, NOT ref-creation.** The coach builds the child containers (ladders) + rows FIRST, then declares the arrangement ("these existing children run in parallel" / "these existing rows are a superset"). The field mirrors `scoring-axis-field`'s conditional reveal + `repetition-axis-field`'s defaults-on-switch. New `Parallel/SupersetArrangementFields` components; the inspector threads `childContainers`/`directRows` (+ `exerciseById` for `buildRowSummary` labels — a prop-thread through `ComposeNodeInspector`→`ComposeContainerInspector`, reuse-before-invent).
- **Two-phase persist = `deferredArrangement` side channel + phase-2 WHOLE composition.** The Omit-guarantee + the route's `.cuid()` validation make a draft UUID in phase-1 unrepresentable, so the converter STRIPS arrangement from phase-1 `schema.composition` and carries the parallel/superset arm on `CreateSchemaPlanNode.deferredArrangement` (refs = draft `NodeId`). The cascade collects `draftNodeId→cuid` for containers AND rows (the row-create return was previously discarded), then phase-2 resolves refs→cuids and sends `{...phase1Composition, arrangement: resolved}` via `useUpdateSchema` (Prisma Json update is wholesale-replace — sending only `{arrangement}` would DROP the other axes; verified `admin.ts:34,232`). DR-2 partial-state inherited (phase-2 failure leaves the tree persisted, refs unwired, surfaced in the drawer copy).
- **Clone safety = BOTH remap-on-clone AND reject-on-convert** (different goals). `cloneNode` builds an old→new `NodeId` map over the cloned subtree and rewrites the arrangement refs (preserves duplicate-and-tweak, charter criterion 2 — without it a cloned parallel/superset block is born broken); the converter's pre-network `validateDeferredArrangement` ref-resolvability check is the correctness backstop (a residual dangling ref → a clean `ConvertIssue`, never a 400). Ref-closure verified: a container's arrangement refs only point within its own subtree.
- **QA-004 = EXISTENCE/SCOPE only; shape/cardinality/`.cuid()`-format is ALREADY enforced** by QA-001's `assertComposeTreeValidForWrite → composeContainerSchema.safeParse` (which embeds `arrangementAxisSchema`). `assertArrangementRefsInScope` (run AFTER the shape guard, **zero extra queries** — reuses the loaded `current.subSchemas`/`rows`) closes the only gap: a well-formed cuid pointing at ANOTHER schema's child (cross-scope leak). Per-ref scope: `childSchemaId`∈direct subSchemas; superset `rowIds`∈direct rows; `pairedWithRowId`∈grandchild rows (the deepest legal ref, 2 levels — the existing one-level `subSchemas:{include:{rows}}` load already covers it). The 400 survives via `handlePrismaError` re-throwing `AppError` first. (Verified divergence from the brief, which framed QA-004 as building a cardinality check too.)
- **Superset rows are DIRECT children only** (QA-201, a domain-correctness alignment found in review): algebra §3.E holds a superset's rows directly; the UI initially offered descendant rows → a grandchild-row superset converted ok client-side but 400'd server-side (partial save). Aligned the UI candidate list + the converter to DIRECT rows (parallel `pairedWithRowId` keeps its sibling-track grandchild scope). The pre-network ConvertIssue net also now rejects non-positive `setEnumeration` (QA-202).
- **Draft `ArrangementAxis` → discriminated union** (refs as `NodeId`): exhaustive `switch` + `satisfies never` in field/converter/resolver/clone, bang-free, structurally parallel to the frozen `arrangementAxisSchema`. `SupersetGrouping` had no external consumer → clean replace.
- **`fast-check` adopted** (catalog `^4.8.0` + `apps/platform` devDep) for the pure Tier-1 property round-trip test (300 runs; internally-consistent parallel/superset refs + a deliberately-invalid arm that pins QA-201/QA-202). First property test in the repo — supersedes ADR-0023's "fast-check deferred until money/date-math" trigger (see `deferred.md`).
- **Process note (worktree-parallelism caveat — for future sessions).** The brief directed `isolation:"worktree"` agents for the independent waves; a fresh git worktree in this pnpm monorepo has NO `node_modules` (worktree setup = a fast `git worktree add`, no `pnpm install`), so an agent in it cannot self-verify check-types/lint — breaking the implement-agent "fix-until-green" contract. Adapted: ran Wave A (api-server) ∥ Wave B (platform) as parallel agents on the SAME checkout (file+package-disjoint → no conflict), agents wrote+self-verified but did NOT commit; the orchestrator committed after integration. Parallelism preserved, verification-blocker + index-race avoided. **Worktree isolation needs node_modules provisioning to compose with pnpm.**
- **Links:** [[D-10.4-3]] (scope, now discharged), [[D-10.4-S2]] (Run-1 base), `deferred.md` QA-101/QA-204/QA-007/QA-004. Verified: ungated platform suite **143 green** (incl. property + cascade phase-2 + clone-remap + convert/resolve units); gated QA-004 api-server cases AUTHORED, run deferred to pre-merge (owner skipped this session).

---

## Deferred — future initiative

### D-PHASE5-SCORING — the scoring/execution layer is the product differentiator (deferred, captured so the future planner starts with the full insight)

- **Status:** DEFERRED to its own later initiative (NOT this one — out of scope per charter/plan ph.5). Captured here because the strategic framing lived only in the origin web-Claude chat; the durable docs (ADR-0037, algebra-spec §3/§6) name the _content_ but not the _why-it-matters_.
- **The insight (verbatim takeaway).** Months went into the cheap layer (presentation: the 34-name taxonomy, connector-forms, headers) that masqueraded as structure. The **executable scoring/execution layer is the real feature-differentiator vs Google Sheets** — and the model is currently _empty_ there. Sheets gives a coach free structure with zero execution semantics; this layer is exactly what Sheets cannot do. That is where to invest once the compose model is clean.
- **The content (the two Gauntlet "scrips" that fall outside structure).** (1) **Conditional scoring** — scoring tied to round/context index, e.g. Gauntlet D "MAX wall balls, but score counts only on rounds 2 & 3." (2) **Parallel-track interleave execution** — the round-by-round alternation semantics of `arrangement:parallel` (Gauntlet C: how the two ladders actually interleave), beyond just "these tracks are parallel." Both are _expressible_ today (axis values) but _not executed_ — the `scoring` axis is present-but-inert (D-SCORING-INERT) and `arrangement:parallel` carries the interleave data (D-ALTGROUP-FOLD) for this phase to consume.
- **Design seed.** Scoring is **data, not footnote text** — a small structured scoring descriptor (a mini-DSL as data) the analytics/execution layer evaluates, NOT prose a human reads. The `scoring` axis is its home; phase 5 makes it live. The inert-guard (`scoring-inert-consumers.test.ts`) is the tripwire that must be deliberately removed when this phase starts.
- **Links.** ADR-0037 Deferred section; algebra-spec §3 (D + C scrips), §6 (inert contract), §8 ph.5; charter Non-goals; plan ph.5. Origin: web-Claude chat 2026-06-02.

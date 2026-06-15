# R1b — Clone editor-UX — `/feature` runner prompt

> Self-contained prompt for a fresh `/feature` runner (you have none of this context). Initiative: **coach-station** (Phase 2), wave **R1b**. The R1a clone **server engine is ALREADY in `main`** — endpoints live; R1b builds the **UI that calls them**. This is the VISIBLE half — after R1b the coach sees and uses clone in the plan editor. **UI-heavy → the owner browser walkthrough is the real acceptance gate** (jsdom is blind to the pointer/modal layer). Branch off `main`; this is a full `/feature` (one per session).

## Mission

Build the coach-facing clone affordances + flows in the plan editor (`apps/platform`), wired to the shipped R1a endpoints. Two interaction shapes (D-4/D-6):

- **Duplicate (instant, silent)** — session / block / schema / row + group members: a `ContentCopyIcon` icon-button → the row's `duplicate` endpoint → the clone appears appended (group members → same group) with scroll-into-view + a brief highlight. **No modal, no toast.**
- **Clone-from (replace, guarded)** — week / day: a "Clone week…" / "Clone a day…" trigger → a source-picker modal (lists the plan's weeks/days with a content summary; **empty sources disabled** with a tag) → a **destructive `ConfirmationModal` (type danger, "this can't be undone", NO undo)** → the `clone-from` endpoint → success toast. Empty-source → an info notice, no destructive UI fired.

## Scope

**IN:** (1) client `api-client` methods + `@repo/query` hooks for the 6 R1a endpoints + query invalidation (clone/duplicate invalidate the week query); (2) the per-element duplicate icon-buttons (session/block/schema/row + boxed group members); (3) the week/day clone trigger + source-picker modal + destructive confirm; (4) interaction states (loading/disabled on the in-flight button; silent append + scroll/highlight; replace toast); (5) jsdom tests for payloads/wiring/request-shapes; (6) the owner browser walkthrough.

**OUT:** the server (R1a — done, in main; do NOT touch it). DnD group-creation (wave **G**). Coach profile (**P**). Templates/archetypes (**R2**). Per `r1-clone-design.md`, clone affordances are buttons, NOT drag — drag-to-group is the separate G wave.

## Ground truth — the UX design is DONE; build to it

- **`initiatives/coach-station/r1-clone-design.md`** — the full design: affordances per floor, the two flows, the exact microcopy (button labels, tooltips, the destructive-replace warning, the empty-source notice), interaction states, a11y, and the contract sketch. **This is the spec — build to it.**
- **`initiatives/coach-station/decisions.md`** — D-4 (per-floor semantics, verbatim) + D-6 (the 5 ratified UX calls: **no undo · block empty sources in the picker · silent duplicate-append · any week + any day as source · copy = everything**). Do not re-litigate.
- **The shipped R1a endpoints** (read them in main): the 6 routes under `apps/platform/src/app/api/platform/training-plans/[planId]/**/{clone-from,duplicate}/route.ts` + the contracts in `@repo/contracts/lms/{week,day,session,block,schema,schema-row}` (the `cloneWeekResponse`/`cloneDayResponse` **discriminated union on `cloned`**, the `duplicate*` strict-empty-body requests + response aliases). The client must handle BOTH union arms (`cloned:true` → refresh + toast; `cloned:false, reason:"empty-source"` → notice, no destructive UI).

## ⚠️ RE-VERIFY the insertion points FIRST (the research stage's #1 job)

`r1-clone-design.md` §2 cites file:line for where each affordance slots into the plan-editor cards (`session-card-head`, `block-card-head`, `schema-card-head`, `schema-row-card`, the group-box-heads, `WeekNavigator`, `DayRowHead`). **Those line numbers are STALE** — they were captured before **PR #271** (`feat/plan-editor-e2e-polish`, now merged into main), which reworked many plan-detail components (`schema-card-head`, `block-card-head`, `schema-row-card`, `session-card-head`, `schema-group-box-head`, `row-group-box-head`, `schema-card-meta`, + new `intensity-fields`, `row-timeline-marker`). The research stage MUST re-read each target component against **current main** and re-confirm: the action-cluster pattern (drag-handle … edit `TuneIcon` … delete `DeleteIcon`/error) still holds; the `ConfirmationModal` prop shape; the `WeekNavigator` structure; whether select-mode / DnD changed anything that affects where a clone button sits. Spec the insertion points from the re-verified tree, not from §2's stale lines.

## Phases (commit units)

1. **Client layer** — `api-client` methods (the 6 endpoints; clone-from carries `{ sourceStartDate }`/`{ sourceStartDate, sourceDayOfWeek }`; duplicate empty body) + `@repo/query` hooks + query-key invalidation (a clone/duplicate invalidates the affected week query so the editor refreshes). Mirror the existing lms client/hook pattern verbatim.
2. **Duplicate affordances** — the `ContentCopyIcon` icon-button on session/block/schema/row cards + boxed group members (re-verified insertion points), `aria-label="Duplicate <floor>"`, in-flight spinner/disabled, silent append + scroll-into-view + brief highlight on the new node. No toast.
3. **Week/day clone flow** — the "Clone week…"/"Clone a day…" trigger (on `WeekNavigator` / `DayRowHead`) → the source-picker modal (the plan's weeks/days, each with a content summary; empty rows DISABLED + "Empty — nothing to clone" tag) → the destructive `ConfirmationModal` (danger; copy from `r1-clone-design.md` §5) → call clone-from → handle the `cloned` union (success toast vs empty-source notice).
4. **Tests + walkthrough** — jsdom tests pin the mutation payloads + hook wiring + request shapes + the union handling; the pointer/modal/scroll layer is NOT jsdom-testable → the owner browser walkthrough is the gate.

## Red lines

- **Reuse existing patterns verbatim** (re-verified post-#271): `IconButton`+`Tooltip` (size small), `ConfirmationModal` (type danger/warning/info), `WeekNavigator`, `PlusRowButton`, the query-hook + invalidation idiom. Don't reinvent.
- **D-6:** no undo · block empty sources in the picker (disabled rows, not a post-error) · silent duplicate-append (no toast) · any week + any day is a valid source.
- **Handle the `cloned` union** — never assume success; the empty-source arm renders a notice, no destructive confirm fires.
- House rules: no hex outside the theme palette; one component per file; MUI floating labels; `aria-label` on every icon-only button; owner-column `UserChip` where applicable.
- **Don't touch the R1a server** (it's in main, done). **Don't build DnD-group** (wave G — buttons only here).

## Acceptance

- `check-types` / `lint` / `dep:check` green.
- jsdom tests green (payloads + wiring + request-shape + union handling).
- **OWNER BROWSER WALKTHROUGH — the real gate** (jsdom-blind): duplicate a session/block/schema/row → appears at the end, silent, scrolled-to + highlighted; duplicate a grouped member → appears inside the same group; "Clone week"/"Clone day" → source-picker lists weeks/days with content, empty ones disabled, pick a non-empty → danger-confirm reads right → replace works; empty-source → notice, target untouched.
- With clone visible in the UI, the roadmap **Phase 2 Exit** (program a multi-week cycle, timed, beats Excel) becomes testable — flag for the owner to time it.

## After R1b

The **R1 clone pillar is DONE** (engine + UI). Next waves (own `/feature` each): **P** coach profile UI (D-5; backend exists, just the form) · **G** DnD group-creation (deferred → DND-GROUP-CREATE; absorbs QA-D-03) · **A-known** polish (LABEL-FLOW-UX + QA-007) · decide **R2** templates/archetypes slot (D-2, parked). The gated api-server suite (incl. the clone suites) stays the owner's R1a verify ritual.

# W3 runner prompt — editor remap onto the Group model (prototype fidelity + gesture set + draft collapse)

> Transport note (owner): paste this whole document as the argument of a `/feature` (full) run in a FRESH session. One full run, nothing else in that session.

## 1. Context

You are implementing **Wave 3 (editor remap)** of the `session-primitive` initiative. Read FIRST, in this order:

1. `initiatives/session-primitive/charter.md` — goal, scope, sacred list.
2. `initiatives/session-primitive/decisions.md` — D-1..D-8, DR-W2-1..9 + DR-W2-FORK-1..6 (the live model law), DR-W2-8 (SUPERSEDED — read it: the order unique EXISTS, in the raw-SQL layer).
3. `initiatives/session-primitive/deferred.md` — the W3 obligations: W2-UX-POLISH (this prompt's items 1–2), W2-DRAFT-RECURSION, QA-004-editor, W2-STALE-FIXTURES / W2-VESTIGIAL-EXPORTS / W2-STALE-NAMES.
4. `initiatives/session-primitive/plan.md` — §W3 and the wave boundaries (W4 = row grammar/leaf residuals, NOT yours).
5. `docs/adr/0041-session-primitive-model-core.md` — the model you are building the editor onto.

**The live law of main (post-W2, ADR-0041):** the box is a persisted `SchemaGroup` (block-owned; members via `Schema.groupId`, `SetNull` dissolution; opaque `label`; `interleaveOrder` validated string; NO order column — position = min(member.order); contiguity is a server invariant). Clustering has ONE source: `buildBlockItems(schemas, groups)` in `@repo/contracts/lms/schema-group` — its sole platform consumer is `block-card-body.tsx`. The full API already exists: `POST …/groups` (atomic group + N ladder tracks), `PUT …/groups/{groupId}` (label/interleave), `DELETE …/groups/{groupId}` (dissolve — members survive as standalone), `POST …/schemas` with optional `groupId` (append into a group's contiguous run), `DELETE …/schemas/{id}` (deleting a group's LAST member auto-deletes the empty group), `POST …/schemas/reorder` ({blockId, orderedIds}, contiguity-guarded). A FULL unique `schemas_block_order ON ("blockId","order")` lives in the raw-SQL layer (`packages/api-server/prisma/sql/lms-checks.sql`, applied at `db:reset`); order-shifting writes must stay collision-safe (descending shift in `resolveGroupedOrder`, two-phase negative-order dance in reorder — do not regress either).

**What W3 does:** the editor catches up to the model — the owner's hi-fi prototype (`plan-editor-hi-fi-v-2`) is the UX law for the group card; one LIVE bug dies; the recursive authoring draft layer collapses. The owner enumerated the W2 polish list as exactly two items — they are Deliverables 1 and 2.

**Binding decisions (do not re-litigate):**

- **D-2 BOX:** grouping only by explicit coach gesture; the label is opaque text the system NEVER reads; no semantics from child count. The prototype evolves the GESTURE LIST (buttons: Add group / Add track / Ungroup — instead of drag-one-onto-another); the principle (explicit, no auto-link) is unchanged. Cross-boundary DnD-grouping is NOT in this wave (it was already deferred once in the plan-editor redesign; the prototype does not have it; revisit on real coach need).
- **D-4 / ADR-0041:** no typed relation kinds; render may special-case NOTHING based on label text.
- **One-predicate rule:** clustering/box-ness ONLY via `buildBlockItems` / `schema.groupId`. No hand-rolled cluster loops — that is how a past CRITICAL shipped.
- **DR-W2-4 idempotency semantics:** the unchecked batch dedups in-modal retries via a stable per-(draft, track) key; close+reopen mints a fresh batch BY DESIGN (W2-IDEM-REMOUNT stays open — do not "fix" it).
- **House:** no hex outside the theme — every prototype color below maps to `palette` slots (`#E07B35` IS `palette.primary.main`; use `alpha(...)`); one component per file; no comments in code; conventional lowercase commits; no `--no-verify`.

## 2. Deliverable 1 — fix the LIVE idempotency-key bug (the unchecked batch is broken in prod-shape)

**Symptom (owner-reproduced):** creating ≥2 ladders with «Group into one box» UNCHECKED → every `POST …/schemas` returns **400 `INVALID_INPUT` "Idempotency-Key header malformed"** (details `{length: 38}`). The whole independent-ladders path is dead.

**Root cause (verified in code):** `use-create-independent-ladders.ts` sends `` `${draft.id}:${trackIndex}` `` (`draft.id` = `crypto.randomUUID()`, 36 chars, + `:` + digit = 38). The server's `validateKey` (`packages/api-routes/src/idempotency/request-codec.ts:8`) enforces `IDEMPOTENCY_KEY_REGEX = /^[A-Za-z0-9_-]{1,256}$/` (`constants.ts`) — length is fine, **the COLON is outside the charset**. The client's default key (`crypto.randomUUID()` in `packages/api-client/src/client.ts:112`) is valid, which is why every other POST works and only our custom-key path 400s.

**Fix:**

1. Change the separator to a dash: `` `${idempotencyBaseKey}-${trackIndex}` `` — uuid chars + `-` are all inside the charset. Keep the stability property (same key per (draft, trackIndex) within the modal session — it IS the retry-dedup mechanism, DR-W2-4).
2. **Pin the seam that let this ship:** W2's tests asserted key STABILITY against a mocked client — nothing validated key FORMAT against the server's contract. Add a test that imports the REAL `IDEMPOTENCY_KEY_REGEX` from `@repo/api-routes` and asserts every key the hook emits matches it (the platform app already depends on `@repo/api-routes` — verify dep-cruiser stays clean). Update the existing stability tests for the new separator.
3. Verify (design stage): the hook is the ONLY custom-key producer (`grep idempotencyKey` across apps/) — if another shows up, pin it too.

## 3. Deliverable 2 — group card to prototype fidelity

The owner's hi-fi prototype is the visual + interaction law. Current state: `schema-group-box.tsx` re-skins W1's `AccentGroupCard` (`accent-dashed`). The prototype replaces it. Exact spec, extracted verbatim from the prototype (`editor.css` + `cards.jsx`), with palette mapping (`--accent` = `--tdp-primary` `#E07B35` = `palette.primary.main`; never hex):

**Group card frame** (`.group-card`): SOLID `1px` border `alpha(primary.main, 0.35)` (the dashed look dies), radius `4`, background `alpha(primary.main, 0.03)`, `overflow: hidden`.

**Head** (`.group-card__head`): flex row, gap `8`, padding `8px 12px`, bottom border `1px alpha(primary.main, 0.25)`, wrap. Contents, in order:

1. `view_column` icon (18, outlined, `primary.main`).
2. Overline text **"GROUP"** (`primary.main`; map the proto `.overline` class to the house overline typography).
3. Inline-editable group label (`subtitle1`; placeholder `"group label…"`; commits `label || null` via the existing update-group mutation — the W1 "group…" placeholder copy is superseded by the proto's).
4. Spacer (`flex: 1`).
5. **Interleave segmented control** (`.seg`): the 2 `PARALLEL_INTERLEAVE_ORDERS` as joined buttons — border `1px palette.divider`, radius 4; button: transparent, `7px 12px`, 12px/600; active: background `alpha(primary.main, 0.14)` + `primary.main` text; hover: `action.hover`. Tooltip: "Interleave order — how tracks weave together". (This REPLACES wherever interleave editing landed in W2 — verify its current home and remove the old control.)
6. **Ungroup** icon-button (`splitscreen` icon, 17) with a `ConfirmationModal`: title "Ungroup", message "Ungroup these tracks? Schemas stay in the block as standalone.", confirm label "Ungroup" → `DELETE …/groups/{groupId}` (the existing dissolve).
7. **Delete group** danger icon-button (`delete`, 17) with confirm: "Delete the group AND its member schemas?" → see Deliverable 3.

**Tracks zone** (`.group-card__tracks`): column, gap `8`, padding `12px 12px 12px 10px`. Each member wraps in a track container (`.group-card__track`): `padding-left: 14px` + a vertical **rail** — absolute `::before`-equivalent, `left: 4px`, width `2px`, full height, `alpha(primary.main, 0.45)`, radius 1; consecutive tracks extend the rail upward across the gap (`top: -8px` for track+track) so it reads as ONE continuous rail tying the tracks.

**Member schema card in-group:** NO drag handle and no drop classes — instead a **track number badge** (`.track-no`): 22×22 circle, `1px` border `primary.main`, `primary.main` text, display font 700 12px, value = 1-based position in the group; tooltip "Track N". Everything else (chips, inline header, row list, per-schema tune/duplicate/delete buttons) identical to a standalone schema card. The per-schema DELETE stays — deleting the last member auto-deletes the group (existing server behavior); make sure the UI survives that (the box unmounts).

**Add track** (`PlusRow`-equivalent at the card bottom, padding `0 12px 12px`, label "Add track"): adds a member to THIS group. The prototype adds instantly (a default ladder schema, no modal); the current app routes through the axis modal with the checkbox hidden. **Fork for Gate A** — (a) proto-faithful instant add (`POST /schemas` with `groupId` + a default ladder composition; coach refines inline after) vs (b) keep the modal flow relabeled "Add track". Rec: (a) — it is the prototype's interaction and the lower-friction daily gesture; the modal stays reachable for standalone schemas.

**Block-level "Add group"** (`BlockCard` in the proto): an affordance alongside "Add schema" that creates a group with TWO default ladder tracks (proto seeds `21-15-9` / `9-15-21`) via the EXISTING atomic `POST …/groups`. Placement per the proto's block footer; exact copy/iconography = design-stage call against the proto.

Component surgery notes: `AccentGroupCard` lives in `@repo/ui` — verify its consumers; if the group box was its only one, leave the shared component untouched and build the proto card platform-local (`schema-group-box.tsx` rewritten); do NOT restyle shared `@repo/ui` primitives for a platform-local need without a Gate-A fork. One component per file — the track wrapper / track badge / seg control split into their own files if they are components.

## 4. Deliverable 3 — gesture persistence on the EXISTING API (no new endpoints)

Wire every prototype gesture to the API that already exists — discovering a genuine gap = STOP and surface at Gate A, do not invent endpoints silently:

1. **Ungroup** → `DELETE /groups/{id}` (members survive — SetNull). Optimistic/refetch via the existing week-query invalidation.
2. **Delete group + tracks** → rec: client-orchestrated sequential `DELETE /schemas/{id}` over the members (the LAST delete auto-removes the empty group server-side — existing behavior). Alternative if the design stage dislikes partial-failure mid-sequence: a server `?withMembers` flag — that breaks the "no api-server changes" boundary, so it needs Gate A + the owner's gated-suite ritual. Rec stands: client-orchestrated, with a mid-failure toast + refetch (the survivors are still a valid group).
3. **Add track** → `POST /schemas` with `groupId` (per the D2 fork outcome).
4. **Add group** → `POST /groups` with two default tracks.
5. **Label / interleave** → `PUT /groups/{id}` (exists; the W1-era label path through schema-header update is dead — verify nothing still points there).
6. **Reorder** — unchanged: boxes drag as single units at the block level via the flatten-to-`orderedIds` call (W2 behavior). In-group member reorder and cross-boundary drag are OUT (track numbers replace member handles, per the proto).

## 5. Deliverable 4 — collapse the recursive draft layer (W2-DRAFT-RECURSION)

`axis-draft.types.ts` still models authoring as a recursive `ComposeContainer.children: ComposeNode[]` — a W1 relic; the stored/render/write models are all flat since W2. Collapse it: the multi-track draft becomes a flat `{ tracks: TrackDraft[] }` shape (or equivalent — design-stage call), the `parallel-ladder-draft` transforms and `build-group-create-request` simplify accordingly, and the modal's submit fork (checked → `POST /groups`; unchecked → N independent creates with idempotency keys; in-group add → single create with `groupId`) reads directly off it. DR-W1-2/DR-W1-5 semantics survive byte-for-byte: default-checked at ≥2 tracks, client-side per-track validation with coach-message parity, non-atomic unchecked path. Migrate the draft-layer tests; behavior pins (checkbox fork, validation messages, key stability) must not weaken.

## 6. Deliverable 5 — QA-004: kind-switch confirm

Switching the repetition kind in the axis editor silently discards authored ladder steps (QA-004, carried since compose-authoring-ux — its ratified disposition was "rides the editor rebuild", which is this wave). Add a `ConfirmationModal` gate: when the switch would discard non-trivial authored content (ladder steps beyond the default, etc. — design stage defines "dirty"), confirm before discarding; clean switches stay silent. Pin with tests.

## 7. Deliverable 6 — W2 hygiene riders (small, bundled)

1. **W2-STALE-FIXTURES:** drop the dead `compoundRep: null` line from `exercise-row-payload-form.test.tsx` + `rest-row-form-schema.test.ts`.
2. **W2-VESTIGIAL-EXPORTS:** delete `composeNodeSchema`/`ComposeNode` (no live consumer) and the self-referential `POSITION_EQUIPMENT_MODIFIERS`/`positionEquipmentModifierSchema`/`PositionEquipmentModifier` dead exports in `_shared/media.ts` — verify zero consumers first; reconcile barrels.
3. **W2-STALE-NAMES:** rename `arrangement-tree.ts` to what it now is (a track/row splitter); fix the coach-visible `DerivedLabelCard` caption "computed (arrangement-first)" (factually wrong — labels derive from repetition only); rename the seed const `BLOCK_FOOTNOTES_WK2_TUE` ONLY if it requires no seed-content change (it is a name, not data — if touching it ripples into api-server test fixtures, leave it and say so).

## 8. Hard red lines

1. **Contracts / Prisma / api-server / seed: UNTOUCHED** (this is a platform wave). The ONLY sanctioned exceptions: the Deliverable-1 test importing `IDEMPOTENCY_KEY_REGEX` (read-only import) and the two contracts dead-export deletions in Deliverable 6 (verify-zero-consumers first). Anything else server-side = STOP → Gate A (it would re-arm the owner's gated-suite ritual).
2. **One-predicate:** `buildBlockItems` stays the sole clustering source; the group card renders FROM it.
3. **No cross-boundary DnD-grouping / member-move drag** — explicitly out (proto-faithful buttons instead; deferred decision stands).
4. **OPEN F-surfaces untouched:** weight exotics, tempo, position, sequence, `Block.timeCap`, `Schema.header` semantics, `or_alternative`, `perSetSubstitution*`, REST plaque carrier (all W4 / F-ledger).
5. **No hex anywhere** — every proto color above is already mapped to `palette.primary.main`/`divider`/`action.hover` + `alpha`. The proto's `--font-display` maps to the house display font stack via theme typography, not a literal.
6. **W2-IDEM-REMOUNT stays as-is** (by-design semantics; do not make keys survive remount).
7. Process: full `/feature` pipeline, real forks at Gate A (D2 add-track instant-vs-modal; any API gap; `@repo/ui` touch if AccentGroupCard turns out shared-consumed); close-out docs (DR-W3-\*, deferred updates, journal, board) ride the SAME PR; conventional lowercase commits, no trailers, no `--no-verify`.

## 9. Verify-then-spec (design stage confirms in code BEFORE locking)

1. `validateKey` + `IDEMPOTENCY_KEY_REGEX` (quoted above) — re-verify; confirm the hook is the only custom-key producer.
2. `AccentGroupCard` consumers across the monorepo (decides platform-local vs shared change → Gate A if shared).
3. Where interleave editing currently lives (DR-W2-FORK-4 moved it onto the box meta — find the exact control to replace with the seg).
4. The current `schema-group-box.tsx` + `block-card-body.tsx` render structure and the week-query invalidation path the mutations ride.
5. `axis-draft.types.ts` + `parallel-ladder-draft.*` + `build-group-create-request.*` current shapes (Deliverable 4's surface).
6. The empty-group auto-cleanup behavior on last-member delete (server) — pin its UI consequence.
7. Barrels/exports for every file you delete/rename; dep-cruiser + eslint early.
8. The W2 lesson, standing: if ANY server file moves, sweep `prisma/sql/` + `scripts/` too — tsc/vitest/ts-greps are blind to the raw-SQL layer.

## 10. Acceptance — the owner's walkthrough script

1. **The bug is dead:** add-schema → ladder → 2 tracks → UNCHECK «Group into one box» → submit → two standalone ladder cards appear (no 400). Simulated mid-batch retry still creates no duplicates.
2. **Side-by-side with the prototype** (`Plan Editor.html`): the group card reads identically — solid tinted frame, GROUP overline + icon, inline label, segmented interleave in the head, continuous accent rail down the tracks, numbered track badges (no member drag handles).
3. Block-level **Add group** → a box with two default ladder tracks appears atomically.
4. **Add track** on a box → a new numbered member at the tail (per the Gate-A fork outcome).
5. **Ungroup** (with confirm) → frame disappears, members stay as standalone schemas in place.
6. **Delete group** (with confirm) → group AND tracks gone.
7. Label edit/clear + interleave toggle round-trip after reload.
8. **Kind-switch confirm:** authoring a ladder then switching repetition kind asks before discarding; switching on a pristine draft does not.
9. Reorder: boxes still drag as units; standalone schemas reorder around them.
10. The `DerivedLabelCard` caption no longer says "arrangement-first".

## 11. Exact verify commands (the ONLY allowed test surface)

```bash
pnpm check-types && pnpm lint && pnpm dep:check
SKIP_ENV_VALIDATION=1 pnpm exec vitest run --project platform
pnpm --filter @repo/contracts test
```

`pnpm --filter platform test` silently no-ops (false green) — never trust it. Root `pnpm test` and ANY api-server suite run are owner-gated — with the red lines held there is NO api-server change, so no owner ritual is required for this wave; if a Gate-A fork breaks that boundary, say so loudly in the close-out.

## 12. Process

- Branch: `feat/session-primitive-w3-editor-remap` off fresh `main`.
- Full `/feature` pipeline; ≤1 full run per session (house budget); owner transports.
- One PR; close-out docs in the same PR. Vercel PR checks are noise (deployments not configured) — ignore.
- The orchestrator reviews the returned diff via git, never the self-report (D-7).

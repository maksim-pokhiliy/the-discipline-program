# coach-station — decisions

D-numbered ratified decisions. Step-level calls that don't merit a full ADR live here; cross-initiative architecture calls go to `docs/adr/`. **Promote here at every gate** — this file is the SSOT for "why."

**Status legend:** `RATIFIED` (decided + acted) · `OPEN` (awaiting owner ratification — do not execute past it) · `SUPERSEDED` (replaced — kept for the trail).

## Index

| ID                     | Topic                                                                                  | Status   |
| ---------------------- | -------------------------------------------------------------------------------------- | -------- |
| D-1 ONE-INITIATIVE     | Phase 2 = ONE initiative `coach-station`; the four pillars run as waves                | RATIFIED |
| D-2 CLONE-FIRST        | Clone (R1) ships first; templates/archetypes (R2) PARKED — slot TBD, not dropped       | RATIFIED |
| D-3 CLONE-SERVER-SIDE  | Clone = server-side deep-clone in ONE transaction (atomic, idempotent, ref-remapping)  | RATIFIED |
| D-4 CLONE-FLOORS       | Per-floor clone semantics: week/day = replace-into-current; session↓ = duplicate-append | RATIFIED |
| D-5 PROFILE-SCOPE      | Coach profile = bio + user-meta, off-spine small; schema NOT expanded                  | RATIFIED |
| D-6 R1-CLONE-UX        | R1 clone UX ratified: no undo · block empty sources · silent append · any week · any day | RATIFIED |

---

### D-1 ONE-INITIATIVE — Phase 2 is one initiative, four pillars as waves

- **Status:** RATIFIED (2026-06-15, owner: "одна инициатива").
- **Decision.** Phase 2 ("Coach station complete") is ONE initiative, `coach-station`. The four pillars — Reuse/Clone (spine), Coach profile, DnD group-creation, Authoring polish — run as sequential waves inside it, mirroring `session-primitive`'s W1–W4 shape. The roadmap Exit is reuse-centric (a timed multi-week cycle that beats Excel); the rest supports it.
- **Rationale.** Matches the process-doc framing ("an initiative = one epic, usually one phase") and the single-phase Exit; keeps one durable board/decisions/deferred home rather than fragmenting Phase 2 across micro-initiatives.

### D-2 CLONE-FIRST — clone ships first; templates/archetypes parked on the radar

- **Status:** RATIFIED (2026-06-15, owner: "сейчас клон, темплейты (архетипы) держим на карандаше, далеко не убирай, потом решим куда впихнуть реализацию").
- **Decision.** R1 **Clone** (deep-copy an existing subtree into the live hierarchy) is the spine and ships first. R2 **Saved compositions / archetypes** (a persisted, re-instantiable template entity) is **kept on the radar, NOT dropped** — we decide where to slot its implementation later (likely at R1's close, once we see whether clone alone beats the Excel baseline).
- **Rationale.** Clone is the direct, verbatim relief of Excel pain #1 ("копировать таблицы и писать одно и то же") and is backend-shaped/low-risk. R2 is persona-grounded ("EMOM ×200" → archetypes) but is a NEW entity + its own mini design-cycle. Critically, **R1 builds the deep-copy engine R2 will reuse** — instantiate-from-template ≈ clone-from-detached-subtree-into-plan — so clone-first is also the right dependency order. Anti-"one more feature" (launch bar): decide R2's in-bar-vs-v1.1 status at R1 close, not speculatively now.
- **Links.** `deferred.md` → TEMPLATES (the parked R2 row).

### D-3 CLONE-SERVER-SIDE — clone is a server-side deep-clone, one transaction

- **Status:** RATIFIED (2026-06-15; owner delegated the call — "3. на твоё усмотрение, это технический вопрос" — orchestrator resolved).
- **Decision.** Cloning at every floor is a **single server-side deep-clone endpoint family** (`POST .../clone` per floor), each running in ONE Prisma transaction: read the source subtree, write a new tree with fresh ids, remap order + group memberships + catalog refs, carry an idempotency key. NOT a client-orchestrated sequence of per-level create calls.
- **Rationale.** A week-subtree clone client-side = hundreds of sequential POSTs, **non-atomic** (a partial tree on failure = the `W1-DUP-RETRY` pain at much larger scale), slow (round-trip latency × hundreds), and the group containers (`SchemaGroup` / `RowGroup`) **have no create-route** — they're born from wrap-gestures — so client orchestration of grouped subtrees is structurally awkward. A server deep-clone is atomic, one round-trip, idempotent, and handles group membership + `order` assignment + ref-remap natively (the server sees the whole tree). New endpoint family + a deep-copy mapper is the right cost.
- **Engineering notes (carried to the R1 wave-plan).** (a) The clone **re-references** the shared catalog — `exerciseId` (FK, `onDelete Restrict` — D-EXID-FK), `modifierIds`, `labelIds`, `media`, the `load`/`tempo`/`side` VOs, `notes` — it copies STRUCTURE + prescriptions and points at the SAME catalog records (it does NOT duplicate Exercises/Modifiers/Labels/Equipment). (b) `order` assignment must respect `@@unique([sessionId, order])` (Block) and `@@unique([schemaId, order])` (Row): append at `max(order)+1`; group-internal inserts may need the canonical 2-pass shift to stay contiguous (`assertGroupMembersContiguous`) — see `[[planner-mutation-invariant-trace]]`. (c) Carry the existing `IDEMPOTENCY_KEY_REGEX` / `prismaIdempotencyStore` layer (a clone is a double-clickable write).

### D-4 CLONE-FLOORS — per-floor clone semantics (owner-verbatim)

- **Status:** RATIFIED (2026-06-15, owner — verbatim spec below).
- **Decision.** Two distinct semantics, per floor:

  **A. Replace-into-current (week, day) — source-pick + destructive warning.**
  - **Week.** A button "clone the previous week" somewhere on the week surface. On click → the coach picks **which** week he wants to clone INTO the current week. On pick → a **warning**: all existing sessions of the current week will be DELETED and replaced by the source week's. If the source week is EMPTY → say so **explicitly**. **Cloning an empty week must NOT clear the current week** (no-op + message).
  - **Day.** Identical flow, scoped to a day.

  **B. Duplicate-append (session, block, schema, row) — in-place, no pick, no delete.**
  - **Session.** Clone works only **within the current week**. An icon-button at the session level. Click → a plain duplicate; the clone appears **in the same day, at the end of the list**.
  - **Block.** Like session (duplicate → append to the same session's end).
  - **Schema.** Like block (duplicate → append to the same block's end).
  - **Row.** Like schema (duplicate → append to the same schema's end).

  **C. Group.** Whole groups are **NOT** cloned. Only **schemas inside schema-groups** and **rows inside row-groups** clone. Cloning an element inside a group appends it to the **end of THAT SAME group** (membership preserved).

- **Rationale.** Replace-semantics on week/day matches the calendar-keyed reality of the schema (`Week` unique by `(planId, startDate)`, `Day` by `(weekId, dayOfWeek)`, no `order`, upsert-on-demand) — you cannot duplicate a week "beside" another; you copy a source's contents INTO a calendar slot. Duplicate-append on session↓ matches the `order`-keyed floors (a clone is just "one more, at the end"). Groups clone their members (not themselves) because a group is an opaque box whose membership is the only relation — duplicating a member is "another member at the end," consistent with D-2/D-4 of session-primitive.
- **Engineering invariants (carried to the R1 wave-plan).** Replace = destructive tx (delete current subtree → deep-copy source; **empty-source guard** skips the delete). Duplicate-append = non-destructive deep-copy at `max(order)+1` of the same parent. Group-internal duplicate preserves `groupId`/`rowGroupId` and inserts **after the last member** to keep contiguity (may NOT be the block/schema tail) — 2-pass `order` shift if needed.

### D-5 PROFILE-SCOPE — coach profile is bio + user-meta, off the spine

- **Status:** RATIFIED (2026-06-15; owner delegated — "5. делай что посчитаешь нужным" — orchestrator resolved).
- **Decision.** The coach profile UI wires the **already-shipped** `coachProfile` GET/PUT plumbing into a form: editable **bio** (the only `CoachProfile` field today, max 2000) + display of/edit for the **User** metadata that already exists (`name`, `timezone`, `image`/avatar). The `CoachProfile` Prisma schema is **NOT expanded** (no branding/gym fields) this initiative. Sequenced **off the spine** — it is not a "faster than Excel" lever.
- **Rationale.** Backend (GET/PUT `/api/platform/coach/profile`, contracts, `withCoachAuth`), route stub, and nav are already in place — the only gap is the client hook + the form, so it is a small standalone. Expanding the schema for branding/gym would be speculative infrastructure for a hypothetical need — exactly the pattern the launch bar guards against. If Denys names a need, the schema add is cheap and additive later.

### D-6 R1-CLONE-UX — the five clone-UX forks, ratified

- **Status:** RATIFIED (2026-06-15, owner — answered the `r1-clone-design.md` §9 forks).
- **Decision.** The R1 clone UX (`r1-clone-design.md`) is ratified with these five calls:
  1. **No undo** on the destructive week/day replace — the danger-confirm is the only guard (no pre-clone snapshot / reverse-op in R1).
  2. **Block empty sources** in the source-picker — empty weeks/days are disabled rows with an "Empty — nothing to clone" tag (a pre-condition, not a post-error; still satisfies D-4's "сообщить явно").
  3. **Silent duplicate-append** — the clone appears + scroll-into-view + brief highlight; no toast (toasts are noise on a dense editor).
  4. **Any week** is a valid clone source (the most-recent prior week sits at the top of the picker; "clone the previous week" is the common case, not a limit).
  5. **Any day** in the plan is a valid clone source (the same picker pattern; maximal reuse).
  6. **Copy = everything.** A cloned week/day reproduces the FULL source subtree — week notes, day label + notes, every session and below — re-referencing the shared catalog. The ONLY thing not copied is the slot position (the target keeps its own week `startDate` / day `dayOfWeek`). No field is exempt (owner 2026-06-15: «копирование значит копирование, мы копируем ВСЁ» — don't overthink it).
- **Rationale.** A solo, non-prod tool: the double-confirm suffices without paying for undo's snapshot/restore infrastructure (the most expensive fork — dropping it keeps R1 lean). Disable-empty beats a post-error notice. Silent-on-a-dense-editor avoids toast spam. Any-source maximizes the coach's reuse, which is the whole point of the pillar.
- **Links.** `r1-clone-design.md` (§9 Resolved); D-4 (the semantics these UX calls dress).

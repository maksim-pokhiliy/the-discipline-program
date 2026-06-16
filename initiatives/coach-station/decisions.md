# coach-station — decisions

D-numbered ratified decisions. Step-level calls that don't merit a full ADR live here; cross-initiative architecture calls go to `docs/adr/`. **Promote here at every gate** — this file is the SSOT for "why."

**Status legend:** `RATIFIED` (decided + acted) · `OPEN` (awaiting owner ratification — do not execute past it) · `SUPERSEDED` (replaced — kept for the trail).

## Index

| ID                          | Topic                                                                                             | Status   |
| --------------------------- | ------------------------------------------------------------------------------------------------- | -------- |
| D-1 ONE-INITIATIVE          | Phase 2 = ONE initiative `coach-station`; the four pillars run as waves                           | RATIFIED |
| D-2 CLONE-FIRST             | Clone (R1) ships first; templates/archetypes (R2) PARKED — slot TBD, not dropped                  | RATIFIED |
| D-3 CLONE-SERVER-SIDE       | Clone = server-side deep-clone in ONE transaction (atomic, idempotent, ref-remapping)             | RATIFIED |
| D-4 CLONE-FLOORS            | Per-floor clone semantics: week/day = replace-into-current; session↓ = duplicate-append           | RATIFIED |
| D-5 PROFILE-SCOPE           | Coach profile = bio + user-meta, off-spine small; schema NOT expanded                             | RATIFIED |
| D-6 R1-CLONE-UX             | R1 clone UX ratified: no undo · block empty sources · silent append · any week · any day          | RATIFIED |
| D-7 PROFILE-SCHEMA-EXTENDED | Coach profile schema EXPANDED — CoachCredential + location/specialties (supersedes D-5 no-expand) | RATIFIED |
| D-8 CLONE-SOURCE-PICKER     | Source-picker = content-anchored list backed by a new `GET …/weeks`; DR-8/DR-3/DR-4 sub-calls     | RATIFIED |

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
- **Decision.** The coach profile UI wires the **already-shipped** `coachProfile` GET/PUT plumbing into a form: editable **bio** (the only `CoachProfile` field today, max 2000) + display of/edit for the **User** metadata that already exists (`name`, `timezone`, `image`/avatar). The `CoachProfile` Prisma schema is **NOT expanded** (no branding/gym fields) this initiative. **[SUPERSEDED by D-7 (2026-06-15): the schema IS expanded for wave P — `CoachCredential` + `location` + `specialties`; the rest of D-5 holds.]** Sequenced **off the spine** — it is not a "faster than Excel" lever.
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

### D-7 PROFILE-SCHEMA-EXTENDED — coach profile schema expanded (supersedes D-5's no-expand clause)

- **Status:** RATIFIED (2026-06-15, owner amended D-5 for wave P: "schema расширяется — CoachCredential + location/specialties"; recorded in the wave-P feature PR per `closeout-before-pr`).
- **Decision.** D-5's "the `CoachProfile` Prisma schema is **NOT expanded**" clause is **superseded for wave P**. The schema IS expanded, additively: a first-class **`CoachCredential`** entity (`title`/`issuer`/`year`/`shownToAthletes`, `onDelete: Cascade`, `@@index([coachProfileId])`, `@@map("app_coach_credentials")`) + `CoachProfile.location String?` + `CoachProfile.specialties String[] @default([])`. Everything else in D-5 still holds (profile off-spine; user-meta editable; bio retained). Branding/gym fields beyond this remain OUT until Denys names a need.
- **Rationale.** The hi-fi prototype ("Athlete's eye") makes credentials a first-class section, and location/specialties are core identity the coach edits. The owner ratified the expansion as real product need, not speculative infra. Additive + non-prod (applied via `db:reset`, no migration files — ADR-0019); zero risk to existing reads (nullable/defaulted columns; admin user-view rides free via the shared `mapToCoachProfile` + full `coachProfile: true` include — no admin edit).
- **Sub-resolutions (baked into the build; design `.feature-dev/1781547787/design.md` §7):**
  - **D-7a** Extend `coachProfileSchema` (not a page-data-only carry) — admin auto-populates via the shared mapper; no admin endpoint edit.
  - **D-7b** Avatar upload = platform-local mirror of admin (new upload route+client+hook, `withCoachAuth`, pinned to the `avatar` context — least-privilege), reusing the shared `@repo/api-server` storage + Vercel Blob adapter (ADR-0013) + `UPLOAD_CONFIG.avatar`. Operator sets `BLOB_READ_WRITE_TOKEN` in `apps/platform/.env.local`.
  - **D-7c** `TimezoneAutocomplete` lifted admin → `@repo/ui` (rule-of-two). **D-7d** `detectBrowserTimezone` extracted → `@repo/shared/helpers`.
  - **D-7e** Profile hooks = `useQuery` page-data + `useOptimisticMutation`; credentials = hand-rolled mutations invalidating the page-data key (not `createCrudHooks`). **D-7f** Self-edit PUT = bespoke `selfUpdateCoachProfileSchema` (no `role`/`email`/`coachIds`/`tokenVersion`). **D-7g** `year` upper bound validated dynamically in the endpoint. **D-7h** Credentials hard-delete. **D-7i** Contract tests = `safeParse` accept/reject.
- **Page-data GET** returns `{user, profile, credentials, trackRecord{monthsActive, athletesCoached, plansAuthored}}` — the 3 track-record numbers are honestly derived from live data; "Sessions delivered" / integrations / notifications explicitly OUT (façade-over-absent-infra).
- **Links.** D-5 (superseded clause); the wave-P feature PR (`feat/coach-profile`); `.feature-dev/1781547787/{design,plan}.md`.

### D-8 CLONE-SOURCE-PICKER — week/day source-picker = content-anchored list backed by a new read endpoint

- **Status:** RATIFIED (2026-06-15, R1b research stage; owner delegated — "включай сервер в скоуп, делай то что чище... скоуп не решающий критерий. решай ты сам"). _(Renumbered from D-7 → D-8 at the R1b↔P merge: wave P's D-7 PROFILE-SCHEMA-EXTENDED landed in main first via PR #273.)_
- **Decision.** The week/day clone-from source-picker is a **content-anchored list of the plan's populated weeks**, backed by a NEW read endpoint **`GET /api/platform/training-plans/[planId]/weeks`** → `{ startDate, sessionCount, dayCount }[]`, most-recent-first, no cap, `verifyPlanOwnership`-guarded. The day picker reuses the SAME week-list (pick a source week) + the existing single-week fetch (pick a day from its 7) — no separate list-days endpoint. NOT the date-picker workaround originally floored as buildable-against-main.
- **Why this overrode R1b's "server is OUT" red line.** Stage-1 research found `r1-clone-design.md` §3 + the runner-prompt acceptance ("the picker LISTS the plan's weeks") **unbuildable against main**: no list-weeks route/hook/key exists; weeks are calendar-keyed `(planId, startDate)` rows, fetched one at a time, lazily upserted; `TrainingPlan` has no span — the plan has no enumerable week-set, it is an unbounded calendar where some Mondays carry content. D-6.4 was ratified without knowing it needed a server capability that did not exist. The owner lifted scope-preservation as the deciding criterion.
- **Rationale (cleaner/correct, not scope-minimal).** (1) Coach UX: content recall ("Week of Jun 9 — 5 sessions") beats date recall — `[[coach-daily-ux-priority]]`. (2) Domain fit: "weeks with content" is a finite, meaningful set; the list self-bounds to valid sources. (3) Low risk + DRY: a standalone aggregate READ; one endpoint serves both flows; does NOT touch the frozen deep-clone engine or any primitive mutation path.
- **Sub-calls confirmed at Gate A.** **DR-8 (refines D-6.2):** weeks block empty sources STRUCTURALLY (only populated weeks listed); days keep the disabled-row + "Empty — nothing to clone" tag. The defensive `cloned:false / empty-source` union arm is RETAINED as a race backstop. **DR-3:** `dayCount` = days-with-≥1-session. **DR-4:** the endpoint emits `startDate` as a UTC-safe `YYYY-MM-DD`.
- **Reversibility.** Additive endpoint — a fallback to the date-picker drops the endpoint + the two list components but keeps the modals. Two-way door.
- **Links.** `r1-clone-design.md` §3 (superseded presentation); D-6.2/D-6.4 (the UX calls this realizes/refines).

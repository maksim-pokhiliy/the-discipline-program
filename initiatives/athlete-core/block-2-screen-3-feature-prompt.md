# athlete-core — block 2, screen 3 (Athlete Records / PR-history) — `/feature` (full) prompt

**For the executor session.** A cross-layer vertical slice for the athlete **Records** screen — his personal PR history: 1RM per movement (history + trend) and benchmark bests per WOD (best-of, direction-aware PR). This is **pre-launch scope item #1** (`docs/roadmap.md`, Block 1) and **block-2 screen 3** of the athlete-core initiative. Wrap via `/feature` (full — it spans a derived-view read endpoint + contract + hook + UI + the route swap).

The data producers all exist already: the athlete-owned, append-only `BenchmarkResult` history + `OneRMRecord` history shipped in screens 1-2, and the `derive-records` best-of/PR/trend lib (block-1, now `lms/athlete-records/`) has been waiting for exactly this screen as its production caller. **This is mostly a READ + presentation slice — no new write model.**

---

## 0. Two SSOTs — visual language vs domain data (governs the whole build)

- **The Claude Design prototype is the SSOT for the VISUAL LANGUAGE only** — layout, density, component vocabulary, rhythm, color semantics, typography, the look of a record card / trend chart / section toggle / history list. Reproduce it faithfully, **native** (MUI 7 + `@repo/ui` + theme tokens; **NO hex, NO transplanted HTML/CSS**). Consistent with the shipped athlete screens (Timetable + Session).
- **Our contracts + `decisions.md` are the SSOT for the DOMAIN & DATA** — which fields exist, which result types, which direction is "better", how records key.
- **Conflict rule:** where the prototype under-covers or contradicts the domain (a missing result-type format, a wrong PR direction, a cross-WOD aggregation the model can't honestly do yet), **THE DOMAIN MODEL WINS** — extend the visual language to cover the case in the same idiom. Never drop a domain state to match the prototype; never invent data the model doesn't have. A real domain case with no prototype pattern = a design gap to flag at acceptance, not a guess to bury.

The mandatory domain coverage in §4 holds regardless of what the prototype shows.

---

## 1. The design

Connect the `claude_design` MCP (authorized via `/design-login`) and import the project, then read `Athlete Records.dc.html`:
`https://claude.ai/design/p/a9a2db42-1917-4ebb-bc51-421a632d5080?file=Athlete+Records.dc.html`

Implement it **visually faithfully but native** (MUI + `@repo/ui` + theme tokens). Owner does a side-by-side walkthrough vs the prototype at acceptance (visual fidelity is a gate) AND checks every domain state works on real data (domain completeness is the other gate).

---

## 2. What this slice is

The athlete opens **Records** (`/athlete/records`, currently a "Coming soon" placeholder) and sees his bests: a **1RM** section (per movement — current best, delta, date; tap → progression trend + the full record history) and a **Benchmarks** section (per benchmark WOD — best result formatted by its type, date, PR badge; tap → attempt history + trend). He toggles/filters between the two, searches by movement or WOD. He can also **add/update a 1RM by hand** here. Mobile-first.

---

## 3. Read FIRST — verbatim anchors (quoted from current `main`)

### 3.1 Athlete-owned record models (the producers — already shipped)

```
// OneRMRecord — Prisma + contracts/lms/one-rm-record/one-rm-record.schema.ts
{ id, userId, exerciseId, valueKg, recordedAt, source }   // source: MANUAL | TESTED | AUTO_INFERRED
//   append history (many rows per exercise); the RECORD = max valueKg; the TREND = all rows by recordedAt

// BenchmarkResult — Prisma + contracts/lms/benchmark-result/benchmark-result.schema.ts
{ id, userId, plannedSchemaId, result, recordedAt, createdAt }
//   athlete-owned, append-only (no performedSessionId, no @@unique); @@index([userId, plannedSchemaId, recordedAt])
//   result = the 6-variant union (§3.2); a re-log is a NEW attempt (D-BR-OWNED-HISTORY)
```

### 3.2 Result types + directions — `contracts/lms/_shared/result.ts`

```
result = discriminatedUnion("type"):
  time {seconds} · rounds_reps {rounds,reps} · load {kg} · max_reps {reps} · distance {value, unit:"m"|"km"} · calories {value}
RESULT_DIRECTIONS: time → lower-is-better; everything else → higher-is-better
```

Cover **all six** formats (each its own unit + display). Direction drives best-of AND the PR badge AND the trend-graph orientation — never asked of the athlete.

### 3.3 The derivation lib — `endpoints/lms/athlete-records/derive-records.ts` (THIS screen is its production caller)

```
type BenchmarkResultEntry = { result: Result; recordedAt: Date }
deriveBestResult(entries): Result | null     // best-of by RESULT_DIRECTIONS (vector compare; lower for time, higher else)
isNewPR(prior, candidate): boolean           // direction-aware PR detection
buildResultSeries(entries): BenchmarkResultEntry[]   // sorted ascending by recordedAt (the trend series)
```

Use these for the **benchmark** side server-side. For **1RM**, the record = `max(valueKg)`, the series = rows by `recordedAt`, the delta = latest vs prior.

### 3.4 What read-path EXISTS vs is greenfield

- **1RM read EXISTS:** `GET /api/platform/athlete/one-rm-records` (block-1; `lms/one-rm-record/admin.ts` `listByUser` + `?exerciseId` filter) + the `useOneRMRecords(exerciseId?)` hook. Returns RAW `OneRMRecord` rows — it does NOT derive best/delta/series.
- **Benchmark read is GREENFIELD:** `benchmark-result/` has only the write service + validator. There is NO benchmark-records read endpoint.
- **Write paths EXIST (for the inline set-1RM affordance):** `POST /api/platform/athlete/one-rm-records` + `useCreateOneRMRecord` (already invalidates the 1RM list).

### 3.5 The `D-1RM-LATEST` distinction (do not conflate the two layers)

`load-records.ts` resolves working-weight `%` off the **LATEST** 1RM (current form). **This Records screen is the OTHER layer — best-of.** Records celebrate the all-time best (max 1RM; benchmark best by direction). The latest value is just the most recent point on the trend. Do NOT show "latest" as the record headline — show the **best**, with the series carrying the journey (incl. any recent de-load dip).

### 3.6 Patterns to mirror

The derived-view read shape: `lms/session-detail/` (a pure builder + a fetch wrapper + types + index; the route under `app/api/platform/athlete/...`; the hook + client; the module under `apps/platform/src/modules/`). Tz-stable dates: `D-SD-DATES` (server emits absolute date parts; client formats UTC — no device-tz `getDate`/`toLocale`). Decisions: `D-TT-SERVER-COMPUTES` / `D-SD-SERVER-RESOLVE` (server derives, client presents), `D-RESOLVER-LMS` (derive libs are lms-local — no lms→coaching edge), `D-SD-ROUTE-PADDED` (`(secondary)` padded `AthleteShell`).

---

## 4. Scope (the vertical slice)

### A. [READ] An athlete-records derived-view endpoint (`lms/`, server-derives — mirror `session-detail`)

`GET /api/platform/athlete/records`, `withAthleteAuth`. A pure builder + a fetch wrapper that returns BOTH sections fully derived (the client does zero derivation/date math):

- **1RM section:** group the athlete's `OneRMRecord` rows by `exerciseId` → per exercise `{ exerciseId, exerciseName (JOIN Exercise), best: max(valueKg), lastRecordedAt, delta (latest vs prior by recordedAt), series: [{valueKg, recordedAt}] }`.
- **Benchmark section:** group the athlete's `BenchmarkResult` rows by `plannedSchemaId` → per schema `{ plannedSchemaId, title, resultType (from the schema's `composition.benchmark.resultType`), best (deriveBestResult), isPr-style flag, series (buildResultSeries) }`. **Title:** resolve the benchmark schema's display name from its context (schema header / session label) — mirror how the session-detail builder derives a title; do NOT invent a WOD name.
- **No N+1:** batch the reads (one `OneRMRecord` query + one `BenchmarkResult` query + the joined exercises/schemas) and derive in-memory — mirror the session-detail/plan-timetable budgets, spy-assert it.
- **Contract:** a new Prisma-free `contracts/lms/records-view/` derived-view entity (mirror `session-detail/`'s triplet — schema + api.schema + types + index, added to the lms barrel).

**Per-schema, NOT per-WOD-name (domain constraint).** A `BenchmarkResult` is pinned to ONE `plannedSchemaId`. The same WOD (e.g. "Fran") authored in two different plans is two different schemas → two record entries; best-of/PR/trend are **per benchmark schema instance**, not aggregated across plans by name. Cross-plan WOD aggregation needs the benchmark CATALOG (the deferred library wave) — do NOT fake it here. (Two-SSOT: if the prototype shows one clean "Fran", honor the visual but key the data on `plannedSchemaId`; a repeated benchmark within one schema is the same entry growing its history.)

### B. [HOOK] Client read hook + endpoint client

`use-athlete-records(...)` (TanStack query) + the endpoint client, mirroring `use-athlete-session-view` / `use-plan-timetable`. The existing `useOneRMRecords` + `useCreateOneRMRecord` stay for the inline set-1RM affordance (§C). Barrel-wire new hooks.

### C. [UI] The records module

`apps/platform/src/modules/athlete-records/` (one component per file, `@repo/ui` + MUI + tokens). **Mandatory domain coverage (§0):**

- **Two sections — 1RM and Benchmarks** — with the prototype's toggle/filter + search (by movement / WOD title).
- **1RM card:** movement name · the **best** kg (the `<DisplayNumber>` idiom from screen 2) · delta · date · `source` tag (`TESTED`/`MANUAL`) if it fits · tap → the progression trend (chart) + the full record history list.
- **Benchmark card:** WOD title · **best** result formatted by its `resultType` (all six — reuse the screen-2 `format-result` formatter) · date · a **PR** badge (direction-aware) · tap → attempt history + trend.
- **Add / update 1RM by hand** here (reuse `useCreateOneRMRecord`; the same inline editor idiom as screen 2's set-1RM) — `{exerciseId, valueKg, recordedAt: now, source: MANUAL}`.
- Empty states: no 1RMs yet / no benchmark results yet (the everyday early state, not an edge case).

### D. [ROUTE] Swap the placeholder

Replace the `/athlete/records` "Coming soon" placeholder (`app/athlete/(secondary)/records/page.tsx`) with the real screen, in the `(secondary)` padded `AthleteShell`.

---

## 5. Sacred / constraints

- **§0 governs:** prototype = visual language; contracts + decisions = domain/data; domain wins on conflict; cover all six result formats + direction-aware PR.
- **Records = best-of, NOT latest** (`D-1RM-LATEST`) — the record headline is the best (max 1RM / best benchmark by direction); the latest is just the newest trend point. Don't wire this screen to the `load-records` latest semantics.
- **Per-`plannedSchemaId` keying** — no cross-plan WOD aggregation (catalog-deferred); don't fabricate a shared WOD identity.
- **Server computes, client presents** (`D-TT-SERVER-COMPUTES` / `D-SD-SERVER-RESOLVE`) — all best-of/PR/trend/delta derivation is server-side via `derive-records` (+ the 1RM max/series); the view is dumb.
- **Dates tz-stable** (`D-SD-DATES`) — any displayed `recordedAt` uses absolute server-emitted parts + UTC formatting; no device-tz `getDate`/`toLocale`.
- **Theme tokens only — no hex, no transplanted HTML** (`no-hex-outside-theme`, `pattern-compliance`). **One component per file. Mobile-first.** **No N+1** in the read (batched + spy-asserted).
- **`lms` ↛ `coaching`** (`api-server-lms-no-coaching`, pre-push `dep:check`) — the derive libs are already lms-local (`D-RESOLVER-LMS`); keep the records endpoint lms-local.
- **Charting:** if a trend chart needs a lib, prefer what the repo already uses; do NOT add a heavy new dep without flagging it. A token-styled lightweight chart (or an existing primitive) is preferred over a new charting dependency.

---

## 6. Out of scope (other waves — do NOT build here)

- The standalone **Profile-management screen** (block-2 screen 4 — bodyweight edit + remembered profile picks; the athlete-profile GET/PUT hook already exists) — the NEXT screen, not this one.
- **Cross-athlete leaderboard** (best-of ranked across athletes) — a later wave.
- The **benchmark / profile / template CATALOG** (which would give cross-plan WOD identity + naming) — the deferred library wave; per-`plannedSchemaId` keying suffices here.
- **% of bodyweight** load reference, plan publish, coach honest-metrics — other waves (`docs/roadmap.md` post-launch).

---

## 7. Acceptance

- The athlete opens `/athlete/records` on REAL data: his 1RMs (best + delta + date + trend/history) and his benchmark bests (best formatted per type + date + PR badge + history/trend), toggle + search working.
- **All six result formats** render correctly; the **PR badge + trend orientation are direction-aware** (a faster Fran is a PR; a heavier Grace is a PR).
- Records show the **best**, not the latest (the de-load case: the record stays the max, the trend shows the dip).
- **Add/update 1RM by hand** works and reflects in the list.
- Owner side-by-side walkthrough: visual fidelity holds AND every domain state works on real data.
- `pnpm dep:check`, `check-types`, `lint` clean; the read endpoint covered by the gated api-server suite (green on reseed); close-out docs land **in** the feature PR.

---

## 8. Process

`/feature` (full), one screen. `db:reset` world, no migration files (this slice is read-only — no schema change). Orchestrator reviews every implement wave via `git diff` (never agent self-report). Ratify any new build decisions into `decisions.md`; land the close-out IN the feature PR (`closeout-before-pr`). ≤1 full `/feature` per session.

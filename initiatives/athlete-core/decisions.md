# athlete-core — decisions

Ratified calls for the Phase-3 athlete-core initiative — the SSOT for "why". Working capture lives in `discovery.md`; calls graduate here once ratified by the owner.

## D-LAYERS — plan-as-train splits into two independent layers

**Ratified 2026-06-17 (owner).**

The plan-as-train metaphor runs on two layers that do not constrain each other:

- **Navigation / performance / statistics — FREE (athlete-core scope).** The athlete sees all cars by default, walks freely forward/back, and may open + perform any car (incl. a missed past one) unlimited times. The timetable and stats do NOT shift from it. The "start" button persists; the "done" tick is set on the first performance and is sticky.
- **Subscription / access — RIGID (Phase-5 monetization scope).** Pay-to-ride by the calendar: a skip buys no credit and no extension; the access window ticks on time-from-payment. Automated ("хочешь продолжить — неси шекели") — the machine refuses, the coach no longer argues it by hand.

**Why.** Resolves the apparent clash with Denys's recorded train-principle (`docs/personas/denys.md` §5.1–5.2; memory `plan-as-train-principle`). Denys's "поезд не ждёт" / make-up anger targets the BILLING dispute ("пропустил неделю → платить рано"), NOT navigation. They were always different layers. Keeps athlete-core free of billing concerns — those are Phase 5.

## D-STATS — "statistics" decomposes into three; the law differs by session type

**Ratified 2026-06-17 (owner).**

- **Compliance tick** = first performance, sticky, never changes.
- **Records / profile** = BEST of all performances.
- **History** = every performance stored, never discarded.
- **Everyday session:** done once in practice; a stray repeat is history-only, never feeds profile/trends.
- **Benchmark session:** every performance is meaningful; best → profile, all → trend.
- The "benchmark" chip is the switch between the two laws.

**Why.** Owner (athlete + coach): in an everyday plan there is no reason to perform a session twice; repeats live only for benchmarks (best-of by nature) and the rare filmed championship-selection attempt. The "first/last/every" fork therefore collapses for everyday sessions (N=1) and resolves to best-of for benchmarks.

## D-RESULT-TYPES — a benchmark result type is one of the six canonical CrossFit score types

**Ratified 2026-06-17 (owner).**

A benchmark carries exactly ONE result type, drawn from a CLOSED set dictated by CrossFit's modalities (monostructural / gymnastics / weightlifting) — not an open flexible field:

1. **time** — For Time (Fran, Grace). Direction: lower is better.
2. **rounds + reps** — AMRAP (Cindy). Higher is better.
3. **load (kg)** — For Load / 1RM (Total, heavy single). Higher is better.
4. **max reps** — per set or per time (max pull-ups test). Higher is better.
5. **distance** — run / row "for distance". Higher is better.
6. **calories** — assault bike / rower / ski-erg. Higher is better.

- **Direction** (lower vs higher = better) is intrinsic to the type — it drives PR-detection and trend-graph orientation; never asked separately.
- **Result type is its OWN axis — correlated with, but NOT derived from, the repetition kind.** The schema format SUGGESTS a default (ladder / timeCap → time; AMRAP-cadence → rounds+reps); the coach confirms or overrides it. The same Fran can be "for time" or "AMRAP in 10 min" — same structure, different result type.
- **"Not for score"** (skill, warm-up, just-do-it) = an ordinary session: benchmark chip OFF, compliance tick only. Chip ON ⇒ a result type is mandatory.

**Why.** Owner: result types are not arbitrary — they flow from CrossFit itself; the three modalities dictate what you measure. A closed canonical set buys typed entry forms (how the athlete records a result) and comparable trends, with no inert flexible field.

**Deferred (Games-grade, NOT MVP):** AMRAP tiebreak-by-time; "missed the cap → score = reps completed" fallback. Recorded for when competition scoring lands.

## D-PUBLISH — plan-level publish; a draft/published snapshot, not a VCS

**Ratified 2026-06-17 (owner).**

Publish is atomic at the PLAN level. The coach builds/edits a plan; pressing **Publish** promotes the working copy to the published snapshot → "Published!" → it becomes visible to athletes enrolled in that plan. Any later edit returns the plan to a working state and must be published again to reach athletes. A simple two-state model — working (draft) vs published — NOT a full version history ("old vs new", not a VCS).

**Why.** Without it athletes watch the plan being written instead of a finished plan (GAP-PUBLISH). Plan-level (not per-day / per-car) keeps the mental model clean and the UI a single button. This is visibility gate #2, distinct from the date-thread (gate #1).

**Open implementation note (not blocking):** what happens to an athlete's existing performance/history if the coach re-publishes a car the athlete already performed — resolve in the Performed\* model design (the published-snapshot vs recorded-history seam).

## D-DATE-THREAD — optional hide-the-past at enroll; future not gated (yet)

**Ratified 2026-06-17 (owner).**

At enroll the coach MAY pick a boarding car; the date-thread then hides PAST cars (everything before boarding). It is OPTIONAL — the default is that the athlete sees the whole train. The FUTURE is NOT gated — the athlete may see cars ahead. Hiding the future is deferred until Denys explicitly asks for it.

**Why.** The plan is the coach's multi-year ASSET; hiding the accumulated past stops a new athlete from receiving the archive. Future-hiding has no current coach demand — no inert gate built before it is needed.

## D-BENCHMARK-MARKER — the benchmark chip rides in `composition`, beside `cap`

**Ratified 2026-06-17 (owner: "да вешай рядом с cap, зелёным").**

A benchmark marker lives in `composition` next to `cap`: `composition.benchmark: { resultType } | null` (null = ordinary schema; set = graded, measured by that result type — one of the six per D-RESULT-TYPES). Render: a GREEN chip beside the cap chip on the schema head — green via a theme token, never a hex literal (`no-hex-outside-theme`).

**Why.** A benchmark is a schema + "this workout is graded, measured this way" — it belongs with the workout definition, and beside `cap` mirrors the cross-cutting-axis pattern the reshape just established. It touches the just-frozen primitive (`composition`) — owner-ratified, like the reshape calls.

## D-LOGGING-MINIMAL — two actions max for MVP logging

**Ratified 2026-06-17 (owner: "completed one action; benchmark = result entry; для МВП достаточно").**

An ordinary session is logged with ONE action — "completed" (the sticky first-performance tick). A benchmark session adds a SECOND action — a result entry (typed, all six result types covered). NO per-exercise actual load/reps in MVP — `PerformedExerciseInstance` (today's per-row Json actuals) is NOT built now; the rich per-row path is post-MVP.

**Why.** The owner's "laziest athlete logs in 30 seconds" floor. Coach honest-metrics (block 3) derive from ticks + benchmark results first; per-row enrichment comes later if needed.

## D-LOAD-RESOLVE — HWPO-style percentage resolution + inline 1RM capture

**Ratified 2026-06-17 (percentage); byProfile pending one clarification.**

Percentage load resolves HWPO-style: if the athlete has a current 1RM for the exercise → convert immediately, he sees kg; if not → show the % AND an inline "set your 1RM" affordance → he sets it on the spot → the 1RM is saved (source `MANUAL`), the profile updates, and the % becomes kg immediately. This makes **inline-1RM-capture** a plan-view / logging surface (a create-1RM path reachable from where the load is shown).

A **leaderboard** (per 1RM and per benchmark, ranked) follows naturally from the records — surfaced scope, for the coach AND the athletes (competitive). Recorded as surfaced, derived from the same records; not MVP-blocking.

**byProfile (the RX/SC × M/F grid) resolves by a DIFFERENT mechanism** — profile attributes, not 1RM (there is no "1RM for a wall-ball profile"). **Ratified 2026-06-17: pick-once-remembered** — the athlete picks his cell once, the profile remembers it (resolve from the profile, prompt when missing), sufficient for block 1 on the current free-string axes. **Profile-type catalog vs union now under discussion** — planner rec is a CATALOG (the project's library pattern: CRUD in admin + create-on-the-fly in the editor, like exercises/labels/modifiers), NOT a hardcoded union; as its OWN library wave (it re-touches the primitive byProfile shape and is kin to the benchmark/template library), NOT block 1. If adopted, the remembered pick binds to the stable catalog profile-type. See discovery `GAP-PROFILE-CATALOG`.

**Why.** Mirrors how a real training app (HWPO) does it — the prescription becomes a concrete number the moment the athlete's data exists, and the gap to set that data is one tap away, not a separate chore.

## D-PUBLISH-MODEL — version/publish-gate, not a deep snapshot

**Ratified 2026-06-17 (owner delegated "делай как знаешь" + the live-plan requirement).** Sets the model left open in D-PUBLISH.

A version/publish-gate, NOT a tree-cloning snapshot: the plan carries published state; the athlete reads only published nodes; the coach edits a live plan freely and those edits stay invisible to athletes until he Publishes. **Requirement (owner):** the coach must be able to edit AND control when edits reach a running plan that already has enrolled athletes. The performed-vs-published seam (editing an already-performed car) is resolved in the Performed\* detail.

**Why.** Matches D-PUBLISH's "not a VCS, old vs new"; cheapest path that gives the coach edit + publish control over a live plan without cloning the whole tree each publish.

---

# Block-1 build decisions (ratified 2026-06-17, `/feature` execution)

Promoted from the block-1 design (`.feature-dev/` design.md §7) + Gate-A/Gate-B calls. Load-bearing "why" for a future session.

## D-DIST-UNITS — result `distance` units are a NEW local `["m","km"]`

**Ratified 2026-06-17 (orchestrator, block-1 build).** The `distance` result type's `unit` is a new `DISTANCE_UNITS = ["m","km"]` local to `_shared/result.ts` — NOT a reuse of `NUMERIC_PACE_DISTANCE_UNITS` (the 5-unit pace superset incl. mi/yd/lap).

**Why.** A CrossFit run/row "for distance" is m or km; reusing the pace superset leaks mi/yd/lap into a closed result vocabulary and couples two unrelated VOs. Answers spec §1.1 "reuse? — confirm at build": do not reuse.

## D-TICK-DERIVED — compliance tick is derived, not a cached column

**Ratified 2026-06-17 (orchestrator, block-1 build).** The compliance tick (D-STATS first + sticky) = the EARLIEST `performedAt` per (session,user), DERIVED over `@@index([sessionId,userId,performedAt])`. No cached `firstCompletedAt` column. Best-of records + last-activity derive the same way (min/max over rows).

**Why.** Tiny per-key row counts make the indexed min/max trivial; a cached column reintroduces a write-time sticky-invariant that can drift — derivation cannot. NB: the coach-metrics WINDOW Map (last-activity) holds the **MAX** `performedAt` per key (its only date-reader is `computeLastActivity`, cross-session max — the faithful translation of the old `max(completedAt)`, repeat-correct); the earliest/tick is the athlete-records lib's separate concern over raw rows.

## D-PROFILE-SELECTIONS — byProfile remembered pick stored on the athlete profile (supersedes contract-shapes §1.3 "no storage")

**Ratified 2026-06-17 (orchestrator; owner-approved Gate A).** byProfile resolves via a remembered pick in `AthleteProfile.profileSelections Json?` — a `{ [axisName]: value }` map, FREE-STRING-keyed, surfaced on the existing `coaching/athlete-profile` GET+PUT (no new route). resolveLoad matches each `cell.coords[i]` against the remembered value for `axes[i].name`; any axis unmatched → `unresolved` naming the axes.

**Why.** D-LOAD-RESOLVE ("the profile remembers it / prompt when missing") is the authoritative ratified SSOT and supersedes contract-shapes §1.3's stale "render-time, no storage" (the resolved kg isn't stored; the PICK is). Free-string keys suffice for block 1; the pick re-homes to a stable catalog profile-type id when the profile-catalog library wave lands.

## D-RESULT-RELATION — a recorded result pins its schema, in its session, with a matching type

**Ratified 2026-06-17 (orchestrator, block-1 build + Gate-B QA hardening).** `PerformedSchemaResult.plannedSchema` FK = `onDelete: Restrict`; `@@unique([performedSessionId, plannedSchemaId])` caps one result per schema per performance. result-create verifies: performed-session ownership (cross-athlete IDOR → Forbidden), schema-is-benchmark (else BadRequest), schema belongs to the performed session (`schema.block.sessionId === performedSession.sessionId`), and `result.type === composition.benchmark.resultType`.

**Why.** A recorded result is athlete history — deleting a scored benchmark schema is blocked, not silently cascaded (surfaces the D-PUBLISH performed-vs-published seam). The session-link + result-type + ownership guards close the Gate-B QA integrity holes (QA-001/002/003/019): a result attaches only to a benchmark schema actually in the performed session, with the declared score type, once.

## D-RESOLVED-SHAPE — resolveLoad returns a 4-variant discriminated `ResolvedLoad`, pure, N+1-guarded

**Ratified 2026-06-17 (orchestrator, block-1 build).** `resolveLoad(load, ctx, rowExerciseId)` is pure (no DB; `ctx` pre-fetches all current-1RMs as a `Map` ONCE) and returns `{resolved, kg, perHand} | {unresolved, missing_one_rm} | {unresolved, missing_profile_pick} | {not_applicable}`, shared by the percentage AND byProfile branches.

**Why.** The block-2 UI needs show-kg / show-%+set-1RM / show-pick-profile / show-BW distinguished without optional-field state encoding. The fetch-then-compute split (load-records fetches once, resolveLoad pure) keeps the plan-view render off an N+1.

## D-SCOPE-PUBLISH — publish/version-gate is OUT of block 1 (its own later wave)

**Ratified 2026-06-17 (orchestrator; owner-approved Gate A).** The plan-level publish gate (D-PUBLISH / D-PUBLISH-MODEL) is NOT built in block 1: the block-1 prompt scope didn't list it, `TrainingPlan` has no publish field, and it's a from-scratch read-gate orthogonal to the data core. The date-thread (visibility gate #1) ships (`hidePastBeforeBoarding`); publish (gate #2) is its own wave. The performed-vs-published SEAM is resolved here via D-RESULT-RELATION (the result pins its schema).

**Why.** Keeps block 1 the data floor; publish is a separable visibility feature with its own schema + read-filter, owner-confirmed out at Gate A.

---

# Block-2 screen-1 (Plan Timetable) build decisions (ratified 2026-06-18, `/feature` execution)

Promoted from `.feature-dev/1781732896/` (design.md §7 + `orchestrator-gate-decisions.md`). Autonomous run — owner delegated ALL gate calls ("run fully without me"); load-bearing "why" for the remaining block-2 screens.

## D-TT-MULTIPLAN — the timetable endpoint returns a LIST of active plans

`GET /api/platform/athlete/plan-timetable` returns `{ plans: PlanTimetableView[] }`. The athlete can hold N≥1 ACTIVE enrollments (the partial unique is `(planId, athleteId)`, not per athlete). The UI shows a horizontal plan-switcher (pills) when `plans.length > 1`; plans ordered `boardedAt` desc, the board defaults to the first plan with visible weeks.

**Why.** The owner-approved design has a switcher; the data model + the coach path already treat enrollments as a list. Screens 2-4 inherit "the athlete may have several plans".

## D-TT-SLOT-MODEL — one row per (week×weekday) slot; status aggregates, cards are per-session

Each visible week materializes all 7 Mon–SUN slots (rest where no non-rest session). A slot carries 0..N session cards. The slot STATUS (date-column color + timeline node) = `today` > `done` (≥1 non-rest session AND every non-rest session done) > `todo` > `rest`. Each session CARD's decoration is per-session (slot.isToday + that session's `done`). Two resolvers ship: `resolveSlotDecoration(status)` + `resolveCardDecoration({isToday,done})`.

**Why.** The prototype is 1 session/day; reality is `Day → Session[]`. The slot/card split is the honest extension (a day with two workouts shows two cars; the node reflects the day's aggregate).

## D-TT-SERVER-COMPUTES — the builder computes the whole view shape; the client is presentation-only

A pure `buildPlanTimetable({enrollments, performedSessionIds, tz, now})` computes per-slot `status`+`isToday`+`dayOfMonth`, per-session `done`, per-plan `todayWeekIndex`+`landingWeekIndex` (athlete tz). The client does ZERO date math beyond locale formatting. Done = ONE batched `performedSession.findMany` → `Set<sessionId>` (no N+1; 1 enrollment + 1 performed + 1 user query total).

**Why.** tz/status logic stays in the tested server helper; the view stays dumb + faithful. The same builder pattern carries to screens 2-4.

## D-TT-DATES-ABSOLUTE — displayed calendar dates are tz-stable (server `dayOfMonth`; weekday from `dayOfWeek`; week-range in UTC)

A plan day's calendar date is ABSOLUTE (the coach scheduled "June 15"), not tz-relative. The server emits `dayOfMonth` (UTC calendar day of `week.startDate + dayOfWeek offset`); the client renders the weekday from the `dayOfWeek` enum + the week-range via `Intl { timeZone:"UTC" }`. ONLY "today"/status detection uses the athlete tz (server-side).

**Why.** The first build derived the displayed day-number/weekday/week-range from a tz-baked instant formatted in the DEVICE tz → off-by-one in sub-UTC timezones (reproduced: "Jun 14–20" vs "Jun 15–21" under LA). Calendar dates must not be tz-baked for display. (Review/QA fix, commit `6c97dcdc`.) **Screens 2-4 that show plan dates must follow this.** **Extended 2026-06-18 (D-TT-NAV-MODEL):** + Monday-snap of non-Monday week starts + a content-bounded contiguous week span.

## D-TT-NO-COACHING-EDGE — the lms builder takes NO dependency on `coaching/`

The builder inlines its own `composeSlotTitle` + `weekCoversToday` and derives the weekday offset from the `dayOfWeekValues` index — it does NOT import `coaching/coach-metrics` helpers (overrode the design's default-import).

**Why.** `lms` is the lower domain; importing up into `coaching` is a backward edge the `api-server-lms-no-coaching` dep-cruiser rule FORBIDS (would fail pre-push `dep:check`). A trivial local copy beats a forbidden edge (rule-of-two: first reuse → copy; consolidate to `lms/_shared` on a 3rd consumer — see `deferred.md`).

## D-TT-SHELL — athlete nav extended to 3 items (Plan / Records / Profile)

`ATHLETE_NAVIGATION` = Plan (`/athlete`, `plans` icon) · Records (`/athlete/records`, NEW `leaderboard` icon) · Profile (`/athlete/profile`). The timetable renders from `athlete/page.tsx` via the existing `PlatformLayout` (header + bottom nav inherited). Records is a "Coming soon" placeholder (screen 3, not built).

**Why.** Matches the prototype's 3-item nav; the shell already exists (same `PlatformLayout` as coach) — only the nav config + one `PlatformIconName` member + the placeholder route were added.

## D-TT-DESKTOP — responsive centered column within PlatformLayout, NOT the prototype's 320px aside rail

**SUPERSEDED 2026-06-18 → D-TT-DESKTOP-3PANE** (owner reversed this on the live walkthrough — the desktop rails ARE built, via a dedicated flush layout). Original call retained for the "why" trail:

Mobile is 100% faithful. On md+ the timetable is a centered ~600px column inside the existing `PlatformLayout` Container; the plan-switcher is the pill row on all breakpoints. The prototype's desktop left plan-rail `aside` was NOT built.

**Why.** `PlatformLayout` is the sacred uniform app chrome (`redesign-is-foundation`); an athlete-only sidebar would be an architecture island. **Owner walkthrough call** — he can request the literal desktop rail as a later wave (see `deferred.md`). Mobile-first is the mandate; mobile is the acceptance gate.

---

# Block-2 screen-1 (Plan Timetable) live-walkthrough revisions (2026-06-18)

Owner side-by-side vs the (updated) prototype on a running dev server. These SUPERSEDE the autonomous-run calls they name; load-bearing for screens 2-4 (same shell + timeline + date model).

## D-TT-DESKTOP-3PANE — desktop is a full-bleed 3-pane app-shell (supersedes D-TT-DESKTOP)

On md+ the timetable is a three-column app-shell: left **Your Plans** rail (plan cards — title · "Week N of M" · "x/y done" · progress bar, selectable) | center timetable | right **Plan Weeks** rail (every week — today-dot · "Week N" · `check_circle` if a fully-done past week else `done/total` · date range, selectable). Both rails are ALWAYS shown on desktop (even at 1 plan → "1 active"); the mobile pill switcher stays gated on `>1` plan and sits BELOW the week-nav (owner deviation from the prototype's above). The updated prototype added the right Plan Weeks column; owner ratified building both. Both rails share one width (`PLAN_RAIL_WIDTH_PX`=320); internal padding is uniform across all three columns with the left rail as the reference (20px horizontal / 24px vertical); outer gutters are the panes' own padding only (no double gutter).

Built via a **dedicated flush layout** (owner: "без костылей, на уровне layouts"): `PlatformLayout` gained `mainVariant: "padded" | "flush"` (default padded — coach + athlete-secondary pages unchanged); the athlete routes split into `(home)` (flush, the timetable) and `(secondary)` (padded, profile/records) groups sharing an `AthleteShell`. Flush = `maxWidth=false`, no gutters, **flexbox full-height** (`Stack height:100dvh` → the `position:sticky` AppBar takes its natural height → main `flex:1`) — NO dependency on the stale `platformHeaderHeight`=56 const (real AppBar ≈84px). Each pane scrolls INTERNALLY (`overflowY:auto`); rail eyebrows are `position:sticky;top:0` WITHIN their pane (a real scroll container now); NO viewport-sticky / absolute positioning. Dividers (rail borders) run flush header→viewport-bottom.

**Why.** Reverses the "sacred-chrome → skip the rail" call: an athlete can hold >1 plan (D-TT-MULTIPLAN) and the rail is the only way to reach them; the prototype is the fidelity gate. A separate flush layout is the no-hack way to give one route full-bleed full-height without negative-margin костыли against the padded Container.

## D-TT-MUILAB-TIMELINE — the day timeline is `@mui/lab` Timeline, continuous by layout

The custom absolute-positioned rail/node was replaced by `@mui/lab@7.0.1-beta.20` (catalog; peer `@mui/material ^7.3.6` ↔ pinned 7.3.6) Timeline primitives (owner: "не изобретаем велосипедов"). Each `DayRow` = `TimelineItem` [date `TimelineOppositeContent` | `TimelineSeparator` | `TimelineContent`]. The line is CONTINUOUS purely by flexbox: separator = `[TimelineConnector fixed-height = dot top-offset][TimelineDot m:0][TimelineConnector grows]`, so it fills above AND below each node and adjacent rows butt seamlessly (NO `margin-top` gap, NO absolute positioning). The separator has a FIXED width (`TIMELINE_COL_W`=18) so different node sizes (today 16 / done·todo 14 / rest 7) centre on one X and the line stays straight; the date column is held off the line by a right margin (`DATE_LINE_GAP`).

**Why.** A custom absolute rail is a reinvented wheel; a margin-offset node breaks the line; a size-driven separator width zig-zags it. MUI Timeline + connector-above-dot + fixed separator width solve all three with pure layout.

## D-TT-NAV-MODEL — content-bounded week span; isRestDay from the coach Day.rest flag

The timetable is TIME, not DB rows: `buildPlanTimetable`'s `computeWeekRange` synthesises a contiguous calendar-week span (empty plans → the current-week scaffold). Bounds: forward = last content week (no buffer); back = `hidePastBeforeBoarding ? mondayOf(boardedAt) : earliest-content-monday`; today always included; landing = today's week; Today button when viewed≠today. Non-Monday week `startDate`s are Monday-snapped (`weekMondayOf`). All calendar math is UTC (tz only picks "today"); span is content+boarding bounded (O(n), `MAX_TIMETABLE_WEEKS`=520). REST is the slot's `isRestDay` = `day.label.rest === true` (coach-declared), NOT "no sessions"; content = sessions ? cards : (isRestDay ? "Rest day" : "No sessions yet").

**Why.** The first build keyed weeks to authored DB rows → gaps and a node glued to whatever row existed. Time-first + Monday-snap + UTC gives a gap-free, tz-stable axis; isRestDay distinguishes a coach rest from an unfilled day. (fix commits `d168755d`, `2603faee`.)

## D-TT-DOTS-SCALE — week-dots threshold + the desktop weeks-nav (resolves the dots-scale carry-forward)

Content-bounded spans can be year-long. The center week-dots render one-per-week only while `weekCount <= DOTS_MAX_COUNT` (16); beyond that they collapse to a "Week N of M" caption. The desktop right Plan Weeks rail is the scalable, scrollable full week list at any length.

**Why.** 52 dots is noise; the caption stays honest about scale, the rail carries the full list.

---

# Block-2 screen-2 (Session / Workout View) build decisions (ratified 2026-06-18, `/feature` execution)

Promoted from `.feature-dev/1781777197/` (design.md §8 Decision Record + the Gate-A resolutions in `tasks.md` + the QA-001 fix wave). Branch `feat/athlete-session-view` (11 commits, off `main`). Load-bearing "why" for the remaining block-2 screens (3-4) and any later session-view work. Verified against the as-built code where the design diverged.

## D-RESOLVER-LMS — the load-resolver family moved coaching→lms (whole dir)

Moved the WHOLE `endpoints/coaching/athlete-records/` dir (5 src + 3 test: `resolve-load` / `load-records` / `derive-records` / `athlete-records.types` / `index` + tests) → `endpoints/lms/athlete-records/`; barrel edits only (drop the `coaching/index.ts` re-export, add `lms/index.ts`); the one `@repo/contracts/coaching/athlete-profile` import (`profileSelectionsSchema`) STAYS — legal (the dep-cruiser bans are `endpoints/lms → endpoints/coaching` and `contracts/lms → contracts/coaching`; an lms-endpoint importing a coaching-CONTRACT matches neither). A pure `git mv` — 0 content lines changed, zero external consumers (grep-verified: the only caller was the coaching barrel re-export).

**Why.** The session-view endpoint is `lms` (athlete reads are lms, per `D-TT`) and `api-server-lms-no-coaching` (dep-cruiser, pre-push `dep:check`) FORBIDS `lms → coaching` — so the resolver it calls had to live in `lms`. Whole-dir is cohesive (shared types file), and `coaching → lms` stays a legal forward edge for block-3 coach-metrics. Splitting the move (load trio to lms, leave `derive-records` in coaching) was rejected — it fragments the shared types file and `derive-records` has zero coaching consumers.

## D-SD-CONTRACT — bespoke Prisma-free session-detail view entity + `resolvedLoadSchema` zod mirror

A bespoke Prisma-free `contracts/lms/session-detail/` view entity mirroring `plan-timetable/`'s triplet (schema + api.schema + types + index, added to the lms entities barrel), with `resolvedLoadSchema` as a zod mirror of the api-server `ResolvedLoad` + a structural-equality type-test safeguard (`session-detail.types.test.ts` asserts the contract and api-server `ResolvedLoad` are mutually assignable, so a drift in either fails the type-test). **As-built note (diverged from the design's spec):** `resolvedLoadSchema` shipped as **`z.union`, NOT `z.discriminatedUnion`** — two members share `status:"unresolved"` (differing on `reason`), and zod v3's `discriminatedUnion` throws at construction on duplicate discriminator values. The `z.union` fallback is type-correct; the parity type-test guards equivalence (a correction of a wrong spec, not a defect — code wins).

**Why.** Detail endpoints return the full shape (manifesto 2.7); the contract must not import api-server types (the `ResolvedLoad` shape is re-expressed as a contract type); the structural type-test catches drift between the two declarations.

## D-VIEW-SHAPE — embedded view (raw VOs + server-computed `resolvedLoad` per row), not raw-entities+id-maps

The view embeds the raw mapped contract VOs AND the server-computed `resolvedLoad` per row (option B), NOT raw entities + a parallel `resolvedLoadByRowId` id-map (option A).

**Why.** `D-TT-SERVER-COMPUTES` → a dumb client; option A pushes the id-join chore to the dumb client and is brittle. Screen-1 precedent.

## D-SD-SERVER-RESOLVE — the server computes `ResolvedLoad` per row

The builder computes `ResolvedLoad` per row server-side via `resolveLoad(load, ctx, row.exerciseId)` and attaches it to the row in the view shape; the client renders the 4-variant + the inline editors POST-then-refetch (zero client-side resolution or date math). `exerciseIds` for the ctx = every `row.exerciseId` ∪ every `percentage.reference.targetExerciseId` (other-exercise % needs the target's 1RM); `loadAthleteLoadContext` is fetched ONCE.

**Why.** `D-TT-SERVER-COMPUTES` / `D-RESOLVED-SHAPE`; the resolver + ctx-builder are already server libs (block-1). Keeps the render off an N+1 (one subtree fetch + one ctx fetch + one performed fetch).

## D-SD-DATES — absolute tz-stable date parts (`dayOfWeek` + `dayOfMonth`); no today-detection on this screen

The session header date is ABSOLUTE: the server emits `dayOfWeek` (enum) + `dayOfMonth` (UTC calendar day of `weekMondayOf(week.startDate) + dayOfWeek offset`); the client renders the weekday from a static map + the raw integer (and `completedAt` via `getUTCMonth/getUTCDate`) — no `Intl`/`toLocale`/device-tz `getDate` anywhere in the module. **No today-detection on this screen** — the user-tz/now fetch is omitted, so the meta header carries `done` only; the **Today pill is deferred** (would need server-side today-detection).

**Why.** `D-TT-DATES-ABSOLUTE`; avoids the screen-1 sub-UTC off-by-one (`6c97dcdc`) by construction, not by careful formatting. Today-detection is the only thing that needs the tz/now fetch and isn't needed for this read screen.

## D-FMT-HOME — the ~6 pure display formatters COPIED into `athlete-session/utils/` (the rule-of-two fallback)

**As-built: COPY, NOT the barrel (Gate-A resolution OQ-3 overrode the design's recommendation).** The ~6 pure display formatters the session view needs (`format-composition-summary`, `format-intensity`, `format-rep-notation`, `format-rest-spec`, `format-result`, `format-side`, `format-tempo-input`) were COPIED into `apps/platform/src/modules/athlete-session/utils/` (byte-identical to the coach `plan-detail` originals). The design RECOMMENDED a `plan-detail/lib/index.ts` barrel re-exporting the pure (Tier-1) cluster; the owner chose the rule-of-two copy instead at Gate A — no barrel was created. (`buildRowItems`/`buildBlockItems`/`deriveCompositionLabel` are imported directly from `@repo/contracts` — already shared.)

**Why.** No existing barrel; the pure cluster couples to UI-coupled siblings in `plan-detail`, so a partial lift risks back-imports; a copy is the rule-of-two first-reuse with zero coupling. **Carry-forward:** lift the pure formatters to `@repo/contracts/lms/_shared/format/` on a 3rd consumer (see `deferred.md`).

## D-SD-BADGE-TEXT — the schema shape badge uses `format-composition-summary` wording

The schema shape badge ships the `format-composition-summary` wording ("cap 20’", "ladder 1-2-3", "N rounds", etc.); the prototype's richer CrossFit vocabulary (AMRAP / TABATA / EMOM) is NOT shipped (Gate-A resolution OQ-1 — CrossFit vocab is a walkthrough refinement only).

**Why.** The prototype's CrossFit vocab is not data-derivable without a heuristic or richer data; the formatter is domain-honest + consistent with the coach side ("domain wins / don't invent"). **Deferred:** CrossFit-vocab badges (OQ-1) — see `deferred.md`.

## D-SD-GROUP-LABELS — data-derivable group/track labels only

Render only data-derivable group treatments: a parallel-group = "Parallel · N tracks" (N = member count via `buildBlockItems`), per-track = `schema.header` or a positional "Track {i}"; a row-group = a neutral bracket (no stored "Choose one" label). Flagged as partly illustrative at acceptance.

**Why.** The domain has no stored row-group label/kind nor a schema `track` field; fabricating semantics violates "don't invent".

## D-SD-SHEET — mobile `Drawer anchor="bottom"`, desktop inline rail

The logging vehicle = a MUI `Drawer anchor="bottom"` on mobile (tap-opened, no swipe, no new dep) and an inline right "Completion" rail on `md+`; branch on breakpoint (both render the same completion card).

**Why.** DSG-4; standard MUI; matches the prototype's tap-to-open sheet + desktop rail.

## D-SD-NUMERIC — module-local `<DisplayNumber>` (no repo-wide typography variant)

A module-local `<DisplayNumber>` leaf (Barlow Condensed 700, `textTransform:"none"`, `pxToRem` consts, `lineHeight:1`) for the big numbers; NO repo-wide typography variant added in this slice.

**Why.** DSG-3; screen-1 hand-rolls the same display number, so this is now the **2nd consumer** — rule-of-two says a theme variant eventually, but no theme-wide churn in this slice. **Carry-forward:** a repo-wide `numeric`/`displayNumber` typography variant (see `deferred.md`).

## D-SD-LOG-ATOMIC — benchmark logging is ONE transactional `performed-session` create accepting `results[]` (supersedes the planned D-SD-LOG-MULTISCHEMA)

**Supersedes the planned D-SD-LOG-MULTISCHEMA two-step (QA-001 fix wave, commit `254e3fe3`).** Logging a benchmark session is ONE transactional request: `createPerformedSessionSchema` gained `results: z.array(createPerformedSchemaResultSchema).optional()` (with a duplicate-`plannedSchemaId` reject in the schema refine); the server handler validates every result, then in a single `prisma.$transaction` creates the performed-session AND all its schema results (commit-or-rollback together). The client `confirm()` posts ONCE (`createPerformedSession.mutateAsync({ sessionId, performedAt, athleteNotes, results })`); the standalone two-step loop is gone. A re-log = a new performed-session (D-STATS: every performance is history; `@@unique([performedSessionId, plannedSchemaId])`).

**Why.** The planned two-step (create the performed-session, then loop `POST …/[id]/result` per schema) could ORPHAN a persisted performed-session + a partial subset of results on a mid-loop failure (QA-001 CRITICAL): the session would show `done=true` (sticky — any performance ⇒ done) while an un-posted schema showed no result, silently, on exactly the marginal-connectivity device this screen targets. Atomic create commits both or neither and collapses 1+N requests to 1.

## D-VIEW-RESULT — `existingResult` = the LATEST logged result per benchmark schema (not best-of)

`existingResult` per benchmark schema = the result on the most-recent performed-session that logged that schema (the "your last result" strip), NOT best-of / PR (Gate-A resolution R3). Falls out of `performed` ordered `performedAt:"asc"` + last-write-wins; no PR computed (the prototype stubs `hasPr:false`).

**Why.** D-STATS best-of→profile is deferred to a later wave; this slice surfaces only the latest logged result. **Deferred:** PR / Records / best-of (block-2 screens 3-4 + the records lib).

## D-SD-ROUTE-PADDED — the session page lives under `(secondary)` (padded `AthleteShell`)

The session page lives under the athlete `(secondary)` route group (the `padded` `AthleteShell` variant from D-TT-DESKTOP-3PANE); the desktop right "Completion" rail is module-internal (not an app-shell pane).

**Why.** The prototype desktop is a focused content page, not a full-bleed 3-pane app-shell (that's the timetable's `(home)` flush layout); `padded` matches. Reversible to `(home)` flush + a flush layout if the owner later wants full-bleed.

---

# Block-2 screen-2 (Session / Workout View) in-schema benchmark-logging re-home (ratified 2026-06-19, `/feature` execution)

Promoted from `.feature-dev/1781807202/` (design.md §7 Decision Record D1-D12 + the Gate-A resolutions + owner live-test rulings in `tasks.md`). Branch `feat/athlete-session-view` (dirty tree = baseline; one working-tree commit after the owner's manual test). A `/feature` FULL run, **escalated from `small` at Gate A** when the design re-home surfaced (Prisma model change + a new endpoint + completion refactor). Owner-ratified at Gate A AND on the live test. This wave **decouples benchmark result-logging from completion** and **re-homes the result to an athlete-owned, append-only model** — it supersedes D-SD-LOG-ATOMIC's batching while preserving its atomicity invariant, and retires D-RESULT-RELATION's `@@unique`. Load-bearing "why" for screens 3-4 (their records/PR UI reads this history) and any later session-view / records work. Verified against the as-built code.

## D-BR-OWNED-HISTORY — the benchmark result is athlete-owned, append-only HISTORY; logging is decoupled from completion (supersedes D-SD-LOG-ATOMIC's batching, retires D-RESULT-RELATION's `@@unique`)

**Ratified 2026-06-19 (owner, Gate A + live test). RFC D1/D2. Supersedes D-SD-LOG-ATOMIC's batching; retires D-RESULT-RELATION's `@@unique`.**

A benchmark result is **re-homed out of `performed-session` into an athlete-owned, append-only `BenchmarkResult`** model: `{ id, userId, plannedSchemaId, result, recordedAt, createdAt }` — NO `performedSessionId`, NO `@@unique` anywhere (`@@index([userId, plannedSchemaId, recordedAt])` for the latest-per-schema read + the per-athlete history; `@@map("training_benchmark_results")`). Each log is a **NEW row** (append; `prisma.$transaction` create, no upsert) — **a re-log is a new attempt, never an overwrite** (owner verbatim: «повторный лог это повторный лог, не перезапись, нам нужна история»). The result is logged in place per benchmark schema via a NEW endpoint and **does NOT flip the done tick** — logging a result and completing a workout are two independent events (owner: «результат становится частью профайла АТЛЕТА (его рекорды)… "completion" тренировки это другое событие»). `existingResult` reads the LATEST by `recordedAt` (D-VIEW-RESULT, unchanged shape — only the source query moved to the athlete-owned model, deterministic tiebreak `orderBy [recordedAt, id]`).

**Supersession of D-SD-LOG-ATOMIC.** D-SD-LOG-ATOMIC folded logging INTO the completion transaction (one `performed-session` create carrying `results[]`). That batching is **superseded** — logging is no longer folded into completion. Its **atomicity invariant is PRESERVED**: each write is still its own atomic transaction (and the `load` case writes two rows in one tx — D-BR-1RM-ATOMIC). The QA-001 orphan CRITICAL ("done=true while an un-posted schema showed no result") **dissolves entirely** — the result no longer lives on the performed-session, so there is no "session done + missing result" coupling that any path can half-apply.

**Retirement of D-RESULT-RELATION's `@@unique`.** `D-RESULT-RELATION`'s `@@unique([performedSessionId, plannedSchemaId])` (one result per schema per performance) is **retired** — append history wants every attempt as a row. The rest of D-RESULT-RELATION holds: the result still pins its schema (`plannedSchema` FK `onDelete: Restrict`), and the create still verifies schema-is-benchmark + schema-belongs-to-session + result-type-match (the `validateBenchmarkResultForSession` validator is reused, relocated).

**Why.** Owner domain ruling — the result is the athlete's record/history (coach-readable, his property), a re-log is a fresh attempt → trend (D-STATS: "all → trend; history = every performance stored, never discarded"); completion is a separate explicit tick. The 1RM→percentage chain demands immediate persistence of a `load` result + its `OneRMRecord` mid-workout — folding into completion makes the prescription stay an unresolved hint for the whole working set (backwards from HWPO / D-LOAD-RESOLVE). The athlete-owned split is strictly cleaner than the rejected `completedAt`-marker design (RFC §6 alt-a) on ownership fidelity, coach-metrics radius (zero files), native append-history, and orphan-safety.

**Reversibility.** Low-medium — the re-home is a Prisma schema change (non-prod, no data to migrate, `db:reset` per ADR-0019, NO migration files); reverting means re-attaching to performed-session, mechanical but touches the same surface. No reason to.

## D-BR-COMPLETION-PURE — completion is the pure tick, UNTOUCHED in radius (coach-metrics zero files changed)

**Ratified 2026-06-19 (owner, Gate A). RFC D3.**

`performed-session` loses ONLY its `results` relation; it keeps `sessionId, userId, performedAt, athleteNotes`. `lmsPerformedSessionApi.create` drops its `results[]` validation loop and per-result writes — completion no longer carries results (it creates one `performed-session` row + the optional note). `done = performed.length > 0` is **UNCHANGED** (byte-for-byte). `verifySessionReachableByAthlete` (the completion IDOR guard, throws `ForbiddenError`, test-locked QA-004) is kept **AS-IS** (NOT swapped to NotFound — see D-BR-IDOR-NOTFOUND / D9). The `performedAt`-migration, `isSessionCompleted` (coach-metrics), and **ALL of `endpoints/coaching/coach-metrics/*` change ZERO files** (grep-verified: `coaching/*` has no reference to the results model at all).

**Why.** The result no longer lives on the performed-session, so completion is genuinely just the tick. Coach-metrics derive adherence/streak/last-activity from `PerformedSession` rows and never read the results relation — re-homing the result touches them not at all. This zero coach-metrics radius is the decisive advantage over the rejected `completedAt`-marker framing (which would force every metric to learn a "logged-but-not-done" marker).

## D-BR-1RM-ATOMIC — a `load` result writes `OneRMRecord` inside the SAME transaction; new `sessionId`-keyed endpoint, old standalone endpoint removed

**Ratified 2026-06-19 (owner, Gate A). RFC D4/D5/D7/D8/D10.**

When `result.type === "load"`, the transaction also creates an `OneRMRecord` `{ userId, exerciseId: <benchmark first SchemaRow by order>, valueKg: kg, recordedAt: <single now>, source: MANUAL }` — result and 1RM commit-or-rollback together so they never diverge (a load result with no 1RM → percentage rows stay unresolved; a 1RM with no result → a phantom attempt). The write is a plain append `create` inside `prisma.$transaction`, wrapped in `retryOnP2034` (the codebase SSI remedy); NO ensure-session, NO DB unique. A `load` benchmark with no rows → `BadRequestError` before the tx (D8 — no exercise to attach the 1RM to). The inline Set-1RM popup's `OneRMRecord` write is untouched and **coexists** (both feed the same 1RM layer).

New endpoint: **`POST /api/platform/athlete/sessions/[sessionId]/result`** — sessionId-keyed (the client holds only `sessionId`; the sessionId is required by both the IDOR guard AND `validateBenchmarkResultForSession`'s schema-belongs-to-session check; mirrors the GET key). Body REUSES the (renamed) `createBenchmarkResultSchema` `{ plannedSchemaId, result }` (the six-variant discriminated union — no JSON editor); response is the reshaped `benchmarkResultSchema`. The **old standalone endpoint is REMOVED** (`POST .../performed-sessions/[performedSessionId]/result` route + `lmsPerformedSchemaResultApi.create` + its private `loadPerformedSessionForAthlete` + the old params schema + the API-client `create(performedSessionId,…)`) — it wrote a `performedSessionId`-bound row that no longer exists. The block-1 **hook + validator + body/response contracts are REVIVED** on the new endpoint (the owner's "don't delete, revive" instruction honored — only the dead `performedSessionId`-route is dropped); `validateBenchmarkResultForSession` is KEPT, relocated into `benchmark-result/validate.ts` so the old `create`'s removal doesn't drop it.

**Why.** Atomicity guarantees result+1RM both-or-neither; the resolver reads `OneRMRecord` on the next GET → percentage rows resolve in place (server-computes/client-presents, resolver UNCHANGED). The deferred.md candidate-cleanup (the standalone route + hook were UI-unused after D-SD-LOG-ATOMIC) is realized AS the revive — two parallel result-write paths would be the exact debt that note warned of (manifesto 2.2). IDOR→NotFound on the new endpoint (D-BR-IDOR-NOTFOUND). `retryOnP2034` absorbs the rare SSI conflict when the `OneRMRecord` insert races a concurrent inline Set-1RM on the same exercise.

## D-1RM-LATEST — working-weight `%` resolution reads the LATEST `OneRMRecord`, not the all-time MAX (benchmark records/PR stay best-of)

**Ratified 2026-06-19 (owner, live-test ruling). New owner law — supersedes the block-1 MAX-1RM resolution semantics.**

Two laws, two layers:

- **Resolution layer (working-weight `%` → kg).** `loadAthleteLoadContext` (`load-records.ts`) builds `currentOneRMByExercise` from `OneRMRecord` rows ordered `recordedAt desc, id desc`, taking the FIRST per exercise = the **LATEST recorded 1RM** (NOT the all-time MAX `valueKg`). So "75% of 1RM" resolves off the athlete's **current** form. A re-logged _lower_ 1RM now correctly _lowers_ the resolved %.
- **Records / PR layer.** Benchmark records and PR detection remain **best-of** — `derive-records.ts` (`deriveBestResult` / `isNewPR`, direction-aware via `RESULT_DIRECTIONS`) is unchanged. The records screen still celebrates the all-time best.

**Why.** Owner ruling on the live test: the working-weight prescription must reflect the athlete's **current** capacity — after detraining (illness, layoff), a deliberate de-load, or a peak-before-competition taper, prescribing off an all-time-max 1RM is wrong (too heavy when detrained, stale when peaked). HWPO programs the working weight off _today's_ number, not a personal record set a year ago. The PR/records story is the opposite concern — there "best ever" is exactly right — so the two layers diverge by design: resolution = latest (current form), records = best-of (achievement). This corrects the block-1 `buildCurrentOneRMMap` MAX semantics (a code change in `load-records.ts`, with `load-records.test.ts` re-asserted MAX→latest); `derive-records` is untouched.

**Reversibility.** Easy — flip the resolution `orderBy`/picker back to MAX `valueKg` (would re-stale the prescription). No reason to.

## D-DUAL-RENDER-KEPT — a logged result shows on BOTH the schema card and the completion echo (intentional, not a bug)

**Ratified 2026-06-19 (owner, live test). Closes QA-005.**

After logging, the result intentionally renders in TWO places: (1) in place on the benchmark schema card (the `<LoggedResultStrip>` inside `<BenchmarkLogPanel>`'s logged state), AND (2) as a read-only echo in the completion rail/sheet and the done card (`<BenchmarkStatusStrip>` — logged → green `EmojiEventsRounded` + `formatResult`; not-logged → muted "result isn't logged yet — log it from the workout above. You can still complete now"). This is **ratified-faithful to the prototype** ("как в прото"), NOT a double-render defect.

**Why.** Owner call on the live walkthrough — the schema-card strip is "your score on this piece, where you logged it"; the completion echo is "your results at a glance as you finish." They serve two reading moments; showing both matches the prototype and the owner's intent. QA flagged it as a possible double-render; the owner ruled it intentional.

---

# Bodyweight-load semantics (ratified 2026-06-18, owner dialogue — planner-held, recorded 2026-06-19)

## D-AC-BODYWEIGHT-LABEL — a `bodyweight` load renders as a label, never the profile weight in kg

**Ratified 2026-06-18 (owner, live dialogue on a real plan). The fix shipped with the screen-2 re-home; this records the load-bearing "why" the executor close-out missed — it was a separate planner-thread ruling, not part of the re-home RFC.**

A `bodyweight`-kind load is **"Bodyweight" / "со своим весом" — a LABEL, never the athlete's profile weight as a kg number.** The shipped resolver is correct: `resolve-load.ts` returns a distinct `{ status: "bodyweight" }` for the `bodyweight` kind (NOT `resolved {kg: bodyweightKg}`), `ResolvedLoad` carries the `bodyweight` variant, and the UI renders the label. The bug this fixed: block-1 substituted the profile weight, so a bodyweight movement showed e.g. "88 kg" (the athlete's own weight), mis-signalling external iron. Bodyweight is the athlete's _attribute_, not a load prescription — "Air Squat 100 kg" is nonsense; the body is the implement, not iron. `weightKg` stays in the resolver context (`loadAthleteLoadContext`) for the future %-of-bodyweight reference + coach tonnage analytics, but never flows into an athlete's prescription line.

**Added load is NOT modeled on bodyweight** (owner: "тело всегда с тобой, это шум без ценности"): a weighted pull-up is a distinct _exercise_ ("Weighted Pull-Ups") carrying an `absolute` load (e.g. 20 kg) — the difference lives at the exercise level, not as a new load kind. There is NO "bodyweight + added" kind.

**Why.** Showing the body weight as a kg load mis-signals external iron and confuses the everyday case (it surfaced the moment the owner set a real Bulgarian Split Squat to `bodyweight` and saw "88 kg"). The fix is semantic, not cosmetic. See `deferred.md` for the deferred **% of bodyweight** reference — the one legitimate place the body weight DOES become a number (a `percentageReference` scope `"bodyweight"`, its own load-model mini-wave).

---

# Block-2 screen-3 (Athlete Records) build decisions (ratified 2026-06-19, `/feature` execution)

Promoted from `.feature-dev/1781838942/` (design.md §7 Decision Record + the Gate-A / Gate-B owner rulings). Branch `feat/athlete-records` (off `main`). A `/feature` FULL run. This wave SHIPS the standalone **Athlete Records** screen (`/athlete/records`) — a READ + presentation slice over the producers that screens 1-2 laid (athlete-owned append-only `BenchmarkResult` + `OneRMRecord` history) + the block-1 `derive-records` best-of/PR/series lib, which got its **first production caller** here (deferred.md). NO new write model, NO schema change. Load-bearing "why" for block-2 screen-4 (Profile) and any later records / leaderboard work. Verified against the as-built code.

## D-RV-1 — endpoint + contract dir = `records-view` (avoids colliding with the `athlete-records/` derive-lib dir)

**Ratified 2026-06-19 (owner, Gate A).**

The endpoint + contract directory is named **`records-view`** — NOT `athlete-records` — to avoid colliding with the existing `endpoints/lms/athlete-records/` derive-lib dir (the `derive-records`/`resolve-load`/`load-records` family moved there in screen-2, D-RESOLVER-LMS). The full naming set: api `lmsRecordsViewApi`; builder `buildRecordsView`; response `recordsViewResponseSchema` / `RecordsViewResponse`; client `createAthleteRecordsAPI` / `api.athleteRecords`; key `platformKeys.athleteRecords.data()`; hook `useAthleteRecords`; UI module `modules/athlete-records/`. (The CLIENT-facing names keep `athleteRecords` — the collision risk is only server-side, where the derive-lib dir lives.)

**Why.** `records-view` is the derived-VIEW (mirrors `plan-timetable`/`session-detail`); `athlete-records` is the pure derive LIB it consumes. Two dirs, two roles — naming the view dir `athlete-records` would shadow the lib dir in `endpoints/lms/`. Confirmed buildable at design time: greenfield paths, all barrel slots free.

## D-RV-2 — delta = recent change (latest − prior), direction-aware, BOTH sections; headline = the BEST

**Ratified 2026-06-19 (owner, Gate A).**

The **delta** = `latest − prior` (the two most-recent rows) — the most-recent CHANGE, direction-aware, for the 1RM section AND the benchmark section (unified). The prototype computed the 1RM delta as a PR-jump (best vs prev-best); we follow spec §3.3 + internal consistency and make BOTH sections recent-change. The **headline** = the BEST (1RM = `max(valueKg)`; benchmark = `deriveBestResult`, direction-aware). Server emits the delta structured (1RM: signed `number`; benchmark: `{value, improved}` where `improved = isNewPR(prior, latest)`); the trend icon derives client-side from the sign / `improved`. Honest negative on a de-load (a re-logged lower number shows a real negative delta — acceptance gate).

**Why.** A unified "recent change, both sections" delta is internally consistent and matches spec §3.3; `isNewPR` (direction-aware, `derive-records.ts`) already gives `improved`. The headline stays best-of (the records story is "best ever"); the delta is the orthogonal "where are you trending" cue.

## D-RV-3 — headline date = date-of-best (`bestRecordedAt`); contract also carries `lastRecordedAt`

**Ratified 2026-06-19 (owner, Gate A).**

The headline date is the **date the best was set** (`bestRecordedAt` — the `recordedAt` of the first row achieving the best, ascending → earliest-set best). The contract ALSO carries `lastRecordedAt` (the most-recent log) for a future "last logged" affordance.

**Why.** A record celebrates an achievement — the relevant date is WHEN it was set, not when the athlete last touched the movement. Both are derivable from the grouped series; carrying `lastRecordedAt` costs one field and unblocks a later "last activity" cue without a contract change.

## D-RV-4 — format lift (widened): `formatResult`/`formatResultParts` → `_shared`; composition formatters → `composition` (NOT `_shared` — barrel-cycle)

**Ratified 2026-06-19 (owner, Gate A). Advances D-FMT-HOME (the 3rd consumer triggers the lift).**

Screen-3 is the **3rd consumer** of result formatting → the D-FMT-HOME carry-forward fires. Two lifts, two homes:

- **`formatResult` + the NEW `formatResultParts`** (the `numStr`/`unitOf` split — `{value, unit}` for the big-number + small-unit) → `@repo/contracts/lms/_shared/format-result.ts` (pure of the `Result` union; same purity class as `RESULT_DIRECTIONS`/`resultSchema` already co-located there). Screen-2's import re-pointed; `formatResult`'s combined wording UNCHANGED ("21 rounds + 9 reps").
- **The composition pure-formatters** (`formatRepetitionLabel` / `formatCompositionSummary` / `formatRestSpec`) → `@repo/contracts/lms/composition` — **NOT `_shared`.** `_shared` is a strict LEAF; the composition formatters depend on composition types, so homing them in `_shared` would create a `_shared ⇄ composition` barrel CYCLE. Screen-2 re-pointed.

The coach `plan-detail/lib/format-*` copies were **intentionally left** (rule-of-two coach copy → carry-forward to re-point coach later).

**Why.** Both clusters are pure-of-contract and hit rule-of-three with this screen (the benchmark subline, D-RV-7, needs `formatRepetitionLabel` server-side; the builder is api-server and can't import from `apps/platform`). The `_shared`-vs-`composition` split is forced by the dependency graph: a pure function homes WITH the type it's pure of, and `_shared` must stay a leaf to avoid the cycle. Leaving the coach copy is the rule-of-two boundary — coach `plan-detail` is its own re-point pass (D-FMT-HOME not fully closed).

## D-RV-5 — module-local `<DisplayNumber>` leaf (the repo-wide numeric variant stays deferred)

**Ratified 2026-06-19 (owner, Gate A). Follows D-SD-NUMERIC.**

The big numbers render via a module-local `<DisplayNumber>` leaf (Barlow Condensed 700, `textTransform:"none"`, `pxToRem` consts, `lineHeight:1`) — extracted from the as-built screen-1/2 inline `sx` idiom (`logged-result-strip.tsx`). NO repo-wide typography variant added; the shared theme variant / `@repo/ui` leaf stays deferred.

**Why.** D-SD-NUMERIC shipped the same module-local leaf for screen-2; this is now the 3rd hand-roll, but the slice takes no theme-wide churn. **Carry-forward:** the repo-wide `numeric`/`displayNumber` typography variant (see `deferred.md`).

## D-RV-6 — palette token `background.sunken = #161616` (chart inset, the step below `recessed`)

**Ratified 2026-06-19 (owner, Gate A). INFO-level, additive.**

ONE new palette token: `background.sunken = #161616` (the chart inner-panel / dot-fill inset color), added to `packages/mui/src/theme/palette.ts` as the next step BELOW `background.recessed` (`#232323`, too light for the inset). Used as `theme.palette.background.sunken` — never a hex literal in a component (`no-hex-outside-theme`).

**Why.** The chart inset has no existing token and `no-hex-outside-theme` mandates one; an additive single-token theme touch matching the `background.*` naming ladder.

## D-RV-7 — benchmark subline = faithful reconstruction from real header/composition/rows, never fabricated

**Ratified 2026-06-19 (owner, Gate A).**

The benchmark subline is reconstructed server-side, priority chain: (1) a compact scheme from `schema.composition` + rows — `formatRepetitionLabel(composition)` + the movement list from `rows` (each `exercise.canonicalName` + its absolute kg when `load.kind === "absolute"`, else omit) → (2) the `formatCompositionSummary` structural label (e.g. "cap 20'", "EMOM 10'×10") → (3) the result-type label (`BENCHMARK_LABEL_BY_RESULT_TYPE[resultType]`). `composition.benchmark` carries ONLY `resultType` (verified) — every displayed part comes from real `header`/`composition`/`rows`, NEVER fabricated. A bare schema (no header/rows/composition) falls to (3) gracefully.

**Why.** The athlete recognizes a WOD by its movements (coach-UX priority); the faithful reconstruction is honestly derivable from the authored schema — no invention. The priority chain degrades cleanly so a sparse schema never breaks the render.

## D-RV-8 — Update-1RM modal honors the prototype (Movement + Value + Date + Tested|Manual), deliberately richer than screen-2's nudge

**Ratified 2026-06-19 (owner, Gate A).**

The standalone "Update 1RM" surface honors the prototype: **Movement** (`Autocomplete` over `useExercises`) + **Value (kg)** + **Date** + a **Tested|Manual** source toggle (default `TESTED`). Responsive vehicle (D-SD-SHEET precedent): mobile `Drawer anchor="bottom"`, desktop `BaseModal` — ONE component, branch on breakpoint. It is **deliberately richer** than screen-2's fixed inline nudge (`commitOneRm` fixes `{MANUAL, now, fixed exercise}`). On success it invalidates BOTH `oneRMRecords.list()` AND `athleteRecords.data()` — via a per-call `onSuccess` in the modal (NOT by mutating the shared `useCreateOneRMRecord` hook, which is screen-2's too).

**Why.** Two different jobs: screen-2 fills a known row's gap mid-workout (fixed exercise / now / MANUAL); screen-3 is the deliberate "log a tested max" surface, so Movement+Date+Source is domain-legitimate, not gold-plating. `createOneRMRecordSchema` already accepts arbitrary `source`/`recordedAt`/`exerciseId` (only `AUTO_INFERRED` is system-only); the dual invalidation keeps both the existing list and the records view fresh without coupling screen-2's hook to screen-3's key.

## D-RV-9 — builder emits ISO instants; client formats via `getUTC*` + static MONTH maps; modal write UTC-anchored

**Ratified 2026-06-19 (owner, Gate A). Follows D-SD-DATES.**

The builder emits each date as ONE ISO instant (`recordedAt.toISOString()`, `z.string().datetime()` at the boundary); the client formats via `getUTCFullYear`/`getUTCMonth`/`getUTCDate` + static `MONTH_SHORT` maps for both granularities ("Apr 2026" chart-short / "22 Apr 2026" history-long) — NO device-tz `getDate`/`toLocale`/`Intl` anywhere. The modal's Date input constructs a **UTC-anchored** Date on write (`new Date(\`${yyyy-mm-dd}T00:00:00.000Z\`)`) so the round-trip is tz-stable.

**Why.** A `recordedAt` is a genuine instant (unlike `session-detail`'s tz-stable calendar day, which splits `dayOfMonth`); ONE ISO + client `getUTC*` DRYs to a single formatter for both granularities and avoids the screen-1 sub-UTC off-by-one by construction (D-SD-DATES), not by careful formatting.

## D-RV-10 — hand-rolled token SVG `<TrendChart>`, NO charting dependency

**Ratified 2026-06-19 (owner, Gate A).**

The progression chart is a hand-rolled token SVG `<TrendChart>` (`viewBox` 600×180; area fill `alpha(primary.main, …)`, polyline `primary.main`, dots filled `background.sunken`; value/date labels as SVG `<text>`; single-point + flat-series guards). NO charting dependency (recharts/visx/etc.) added — zero chart deps repo-wide. The chart is value-type-agnostic: it plots numbers; the card supplies the labels.

**Why.** A single small line chart does not justify a charting dependency's weight; the prototype hand-rolls SVG and the codebase has zero chart deps to match.

## D-RV-11 — no N+1: exactly ONE `oneRMRecord.findMany` + ONE `benchmarkResult.findMany`, derive in-memory

**Ratified 2026-06-19 (owner, Gate A). Follows D-TT-SERVER-COMPUTES / D-SD-SERVER-RESOLVE.**

The fetch wrapper (`lmsRecordsViewApi.getRecords`) issues exactly ONE `prisma.oneRMRecord.findMany` (include `exercise`) + ONE `prisma.benchmarkResult.findMany` (include schema header+composition+block→session labels + rows→exercise), both `orderBy [recordedAt asc, id asc]` (the D-BR-OWNED-HISTORY tiebreak); `buildRecordsView` derives both sections 100% in-memory. Spy-asserted ≤1× each. No `user.findUnique` (dates are UTC-formatted client-side, no tz needed — unlike `plan-timetable`).

**Why.** The includes carry every JOIN the builder needs; the two `@@index([userId, …, recordedAt])` cover the `where {userId}` reads. The render stays off an N+1 by construction (the screen-1/2 server-computes pattern).

## D-RV-12 — server emits a numeric `scalar` per benchmark series point (the chart plot value)

**Ratified 2026-06-19 (owner). Refinement over design §5.8 (the chart-plot seam).**

The server emits a numeric **`scalar`** per benchmark series point — the value the chart plots — so the `scoreOf`-style "turn a Result into a plottable number" logic stays SERVER-side (D-SD-SERVER-RESOLVE). The client never re-derives a plot number from the raw `Result`; the chart reads the server's `scalar`.

**Why.** Turning a six-variant `Result` into one comparable number is domain logic (it must agree with the direction-aware best/PR derivation); pushing it client-side would duplicate `scoreOf` and risk a chart that disagrees with the headline. Server-emits the scalar → the chart and the records logic share one source of truth.

## D-RV-13 — server emits each 1RM series point's `source` (per-row provenance chips)

**Ratified 2026-06-19 (owner). Refinement over design §5.2 (the history-list provenance seam).**

Each 1RM series point carries its `source` (`TESTED` / `MANUAL` / `AUTO_INFERRED`) so the expanded history list renders a per-ROW provenance chip (prototype fidelity), not just one chip on the headline best. The builder already has `row.source` in hand.

**Why.** The prototype's 1RM history shows where each entry came from (a tested max vs a hand-typed estimate); the per-row source is free (already fetched) and the athlete reads provenance per attempt, not only for the best.

## D-RV-14 — server-authoritative `isBest`: the server flags exactly one series point as the PR row (fixes QA-001)

**Ratified 2026-06-19 (owner, Gate B QA-001 fix). Supersedes design §5.4's "client matches the PR row by date".**

The server flags **exactly one** series point per record as `isBest` (the deterministically-chosen best row — the first achieving the best by ascending `[recordedAt, id]`); the client marks the PR row by reading `isBest`, NOT by `recordedAt`-equality against the headline.

**Why (QA-001).** Design §5.4 had the client match the PR row by `(value, recordedAt) === (best, bestRecordedAt)`. But same-day 1RM logs are midnight-UTC-anchored (D-RV-9 / D-SD-DATES) → multiple rows collide on the SAME instant, so date-matching mislabels (or double-labels) the PR row. A server-authoritative `isBest` flag — decided once by the same deterministic tiebreak as the headline — is unambiguous; the client does zero best-row logic.

## D-RV-15 — distance normalized to meters for comparison; displayed value keeps the athlete's original unit (fixes QA-002)

**Ratified 2026-06-19 (owner, Gate B QA-002 fix).**

For best / PR / delta / chart-scalar comparison, `distance` is normalized to **meters** (km × 1000) — in both `derive-records`'s `scoreVector` and the records builder's `magnitudeVector` / `resultScalar`. The DISPLAYED result keeps the athlete's ORIGINAL unit (m or km, as logged). This corrects screen-2's PR badge too (same comparison path).

**Why (QA-002).** The logging UI permits per-log m OR km (D-DIST-UNITS: `["m","km"]`); comparing by raw value mis-ranks a "5 km" run BELOW a "4000 m" run (5 < 4000 by the bare number) and computes a nonsense delta. Normalizing to a canonical unit (meters) for comparison fixes ranking/delta while preserving the athlete's chosen display unit. `derive-records` was already the screen-2 PR source, so the fix lands once and corrects both screens.

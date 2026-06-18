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

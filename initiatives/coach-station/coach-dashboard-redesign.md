# coach-station — /coach dashboard redesign ("Triage Stack") + real-data backend

A durable design+decisions record for the `/coach` (apps/platform) redesign wave. Promotes the load-bearing reasoning out of gitignored `.feature-dev/1781596013/` per the promotion rule. The detailed RFC/plan/review/qa stay in scratch; this is the SSOT distillate.

**Status:** BUILT (one branch `feat/coach-dashboard-triage-stack`, one PR — owner directive overrode design.md's two-wave phasing). Review **B−/C+** → all CRITICAL + the user-#1-priority WARNINGs fixed; the remaining follow-ups are in `deferred.md`. Gated api-server suite owner-owed.

**Relationship to the board.** This is a self-contained feature wave, NOT one of `state.md`'s tracked pillars (R1 clone / P profile / G dnd / A-known). design.md declares it "the first page of a full apps/platform redesign" — its new `@repo/ui` primitives are the reusable visual-language foundation for the wider redesign. The board is unchanged; this doc + the `deferred.md`/`journal.md` entries are the additive record.

---

## 1. Summary

`/coach` is Coach Denys's morning home screen. A full dashboard vertical slice already existed end-to-end (contract → endpoint → route → client → hook → 4 UI sections), but **every schedule-derived metric was a stub** (`workouts*Today/ThisWeek = 0`, every athlete `NO_SCHEDULE`, `progressBuckets EMPTY`, `computeMissedWorkoutsConditions → []`, the single-athlete detail equally stubbed, `PerformedSession` read nowhere in `api-server`). This wave **recreated the hi-fi "Coach Dashboard — Triage Stack" prototype in MUI 7 / React 19 AND backed it with real data**: a batched, tz-aware, windowed coach-metrics engine fills the dashboard roster AND the single-athlete detail through one shared compute core, plus the missed-workout action-item generator, resolve-with-note, the coach-notes drawer pane, and a coach-facing athlete profile (Health pane). All contract changes additive/backward-compatible; no Prisma schema change.

The owner LIFTED the prior "don't touch backend/contracts" restriction for this wave. The prototype (`.feature-dev/1781596013/prototype/`) was the visual + IA ground truth (recreated, not ported).

---

## 2. Architecture

### 2.1 The shared metrics engine (the heart)

A new package module `packages/api-server/src/endpoints/coaching/coach-metrics/` — pure-ish functions over already-loaded Prisma rows + tz. The "compute once, two callers" seam:

- `load-schedule-window.ts` — the batched, windowed Prisma reads. For a roster of N athletes: **exactly two `findMany` + one `groupBy`**, regardless of N (no per-athlete query). The enrollment+schedule read filters `Week.startDate ∈ [today−30d, end-of-window]` (rides the `Week(planId,startDate)` index); the performed read rides `PerformedSession(userId)`; the `week.groupBy` gives honest `totalWeeks`/`firstWeekStartByPlan` even when a plan's first week is outside the window. Empty `athleteIds` short-circuits.
- `compute-athlete-metrics.ts` (+ extracted sub-helpers `adherence` / `day-status` / `last7-days` / `last-activity` / `missed-and-streak` / `plan-data` / `scheduled-day` / `today-status` — each <50 lines) — the pure core (no DB). Returns everything both consumers need: `todayStatus`, `todayWorkoutTitle`, `missedCount`, `consecutiveMissedDays`, `lastActivityDate`/`daysSinceLastActivity`, `adherenceRate`/`processStatus`/`engagementPct`/`weeklyDelta`, `planDiscipline[]`, `recentWorkouts[]`, `nextWorkout`, `last7Days[]`, `currentWeek`/`totalWeeks`, `currentStreak`/`missedThisWeek`, `primaryPlanId`/`primaryPlanName`.
- `workout-title.ts` — the ONE session-titling convention (`Session.label?.name ?? Day.label?.name ?? "Workout"`), reused everywhere a session is named (no existing convention existed — see DR-6).

Two consumers call the SAME core: `getDashboard` (whole roster, one `loadScheduleWindow` + one `createStartOfDayCache(tz)`, `computeAthleteMetrics` per athlete) and `getAthleteDetail` (one athlete). `computeMissedWorkoutsConditions` (the reconcile seam) is rewritten off the same window+core.

### 2.2 Computed-date rule (no schema change)

Session has no date column. A session's calendar date = `week.startDate + dayOffset(day.dayOfWeek)`, Monday=0…Sunday=6 (`DAY_OF_WEEK_OFFSET` keyed on the FULL enum names `MONDAY..SUNDAY`). All date filtering is on the indexed `Week.startDate` window, never a synthetic Session date. _Completed_ = a `PerformedSession` `(sessionId,userId)` with `completedAt != null`. _Missed_ = computed-date strictly past + non-rest + uncompleted. _Rest_ = `day.label.rest === true` OR a Day with zero sessions. _NO_SCHEDULE_ = no active enrollment/week/day covering the date.

### 2.3 New / changed endpoints

- **resolve** (`coach-action-item.ts`) — optional body `{ reason?, note? }`; `reason` schema-constrained to `z.literal(MANUAL_CONTACTED)` (server cannot be coerced to an `AUTO_*` reason); no body → `MANUAL_CONTACTED` (back-compat). A note triggers a CoachNote create reusing the same isolation; **item update + note create run in ONE `prisma.$transaction`** (no orphan; rollback tested). Route switched `createAuthActionHandler` → `createAuthPostByParamHandler` (200→201, client reads body).
- **getAthleteProfile** (NEW, `athlete-profile-for-coach.ts`, added to `coachingCoachAthletesApi`) — guarded coach read of an athlete profile (`resolveCoachId` + `verifyAthleteBelongsToCoach`); synthesizes a HEALTHY default when the athlete never filled one (Health pane always renders). The unguarded self-service `coachingAthleteProfileApi.get` was deliberately NOT reused. New route `athletes/[userId]/profile`.
- **coach-notes athlete filter** (`coach-note.ts` `getAll(userId, athleteId?)`) — server-side `athleteId` filter, guarded; route switched to `createAuthGetWithQueryHandler`.
- **getDashboard / getAthleteDetail** — stubs filled from the engine.

### 2.4 The @repo/ui primitive foundation

Nine new theme-token-only primitives (no hex; `alpha(theme.palette.*, <named const>)` recipe), one component per file, foldered `name/name.tsx` + `index.ts`, reviewed grade A: **PulseBand**/**PulseBandCell**, **SeverityActionCard**, **ActionTypeChip**, **RosterList**/**RosterRow**, **SectionHead**, **TodayStatusLabel**, **BatchActionBar**, **LastSevenDaysStrip**, **ReasonOption**. Each maps a prototype visual object to MUI; barrel-only consumption. These are the reusable visual language for the wider apps/platform redesign.

### 2.5 Client / hooks

New client modules `coachNotes` (list/create/delete) + `coachAthleteProfile` (get); `coachActionItems.resolve(itemId, body?)` extended. New `platformKeys` entries + hooks (`useCoachNotes`, `useCreateCoachNote`, `useDeleteCoachNote`, `useCoachAthleteProfile`); `useResolveActionItem` mutation variable changed `itemId: string` → `{ itemId, reason?, note?, athleteId? }` (object-form at all 3 call sites). New `formatTimeAgo` in `@repo/shared` (relative time-ago across the action card, drawer action-items, notes).

### 2.6 UI recompose

The Triage Stack as a single linear scroll: page-body header band (no shared-chrome change) → PulseBand (3 cells) → Needs Attention (severity-sorted `SeverityActionCard`s, inline quick-resolve + drawer chevron) → Today roster (filter tabs + per-row batch-from-rest + `BatchActionBar` mailto) → Falling Behind (top-N + per-row trend) → footer microline. The drawer is an in-place overlay on `/coach` (local `selectedAthleteId`, NOT `?athlete=`), reorganized into Today / Plan / Notes / Health tabs with the open-action-items block pinned. The Alert-based `AthleteCard`/`DashboardSection`/`ActionMenu` were removed with their consumers (zero dangling refs).

---

## 3. Ratified decisions (DR-1..DR-11 + Gate-A Q-A..Q-I)

design.md's Decision Record, promoted. Gate-A resolutions (`plan.md` Open Questions) folded in.

- **DR-1 (phasing) — SUPERSEDED by owner directive.** design.md recommended two waves (visible redesign first, metrics engine as immediate follow-up). The owner overrode: **NO PHASING — one unified plan, one branch `feat/coach-dashboard-triage-stack`, one PR**; Wave 1/Wave 2 merged into one dependency-ordered task list. (Recorded here because the build diverged from the RFC's strong recommendation on an owner call.)
- **DR-2 (metrics architecture).** One shared `coach-metrics` engine, batched + windowed, feeding both the dashboard roster and the single-athlete detail; no per-athlete loops; window on the indexed `Week.startDate`. **Built as specified** (refactored finer than planned — every sub-helper <50 lines).
- **DR-3 (no schema change).** All metrics computed from existing models; `db:reset` not invoked for this wave. Telegram OUT; messaging = mailto.
- **DR-4 (tz).** Coach tz for the roster aggregate (ratified in code: `tz = coach.timezone ?? "UTC"`, weeks start Monday). **Gate-A Q-B resolution: coach-tz THROUGHOUT for v1** (including the drawer last-7/today), not athlete-tz-in-drawer — the metrics core takes `tz` as a param, so a later switch to athlete-tz in the drawer is a one-line change. (design.md's recommendation was athlete-tz-in-drawer; simplified to coach-tz-throughout at Gate A.)
- **DR-5 (today-status semantics).** Derived per the train metaphor (`denys.md`: "поезд не ждёт"): **today is never MISSED** (the day hasn't departed — it maps PENDING|COMPLETED|REST*DAY|NO_SCHEDULE); only PAST days become MISSED (drives `missedCount` + `last7Days`). **Gate-A Q-A resolution: COMPLETED is strict-all** (every non-rest session that day completed), NOT the `WORKOUT_FULLY_COMPLETED_RATIO 0.9` partial-credit option. The threshold \_numbers* in `coach-dashboard.constants.ts` predate the frozen primitive — treated as **provisional** (Q1 caveat).
- **DR-6 (titling).** Compose `Session.label?.name ?? Day.label?.name ?? "Workout"` in one helper — a PROPOSED convention (no existing session-titling convention in the codebase; plan-editor renders sessions structurally, never a string title). Flagged as proposed at Gate-A Q1-titling; **adopted**.
- **DR-7 (drawer open model).** In-place overlay on `/coach` (local selected-id state, not the athletes page's `?athlete=` URL param) — opening it as a transient overlay keeps the coach on their triage scroll. **Built as specified** (Gate-A Q-D).
- **DR-8 (resolve sheet UI).** `FormModal` (the established centered-modal idiom: form + Cancel/Save + error), NOT a new bottom-sheet pattern. Bottom-sheet deferred (a genuinely new `@repo/ui` pattern, nice-to-have). **Built as specified** (Gate-A Q-E).
- **DR-9 (header).** Page-body header band, no shared `PlatformHeader`/`PlatformLayout` change (the chrome is shared with the athlete app — avoid the blast radius). Right attention pill (accent + count; green "All clear" at 0). **Built as specified.**
- **DR-10 (caching).** 60s `inMemoryCache` for the roster metric aggregate, key `coach-metrics:${coachId}`, busted on resolve/note writes (mirrors the existing reconcile 60s cache). The dashboard tolerates 60s staleness. **Built as specified** (Gate-A Q-I). Caveat surfaced in QA: the cache is **coach-write-busted only** — athlete-side completion (the athlete logs a workout) is eventually-consistent within the TTL (no cross-actor invalidation); accepted by design.
- **DR-11 (Falling-Behind trend).** Additive optional `engagementPct`/`weeklyDelta` on `ProgressAthlete` (populated for fallingBehind rows only) — makes the section informative. **Built as specified** (Gate-A Q-C).

**Other Gate-A resolutions:** Q-F messaging = **mailto confirmed, Telegram deferred** (email is in every athlete shape; Telegram is OUT of MVP per `docs/roadmap.md`). Q-G plan-editor **deep-link** from the drawer (`/coach/plans/[planId]` — route existence flagged for verification, see deferred QA-UI-5). Q-H (REST_DAY vs NO_SCHEDULE) resolved model-grounded (rest = label.rest or zero-session day; no-schedule = no covering enrollment/week/day).

**Adversarial/correctness invariants confirmed in review+QA (positive evidence):** auth/IDOR solid (every per-athlete path `resolveCoachId` + `verifyAthleteBelongsToCoach`); resolve body rejects `AUTO_*`; resolve+note tx rolls back; no N+1 (the loader is genuinely batched); today-never-MISSED + strict-all-COMPLETED + adherence divide-by-zero guarded; empty-roster/no-schedule returns a valid zeroed shape; honest `totalWeeks` for >30-day plans via the unfiltered `groupBy`.

---

## 4. Pre-merge fixes landed (review/qa CRITICAL + user-#1-priority WARNINGs)

- **CORR-001 (CRITICAL):** `nextWorkout` was structurally unreachable for any future week (the window upper bound was this-week's Sunday). Fixed via a dedicated next-workout lookup in the single-athlete detail path + a future-week test.
- **CODE-001 / QA-METRICS-1 (WARNING):** the dashboard had a local DST-unsafe `weekCoversToday`/`pickPrimaryEnrollment` (raw `MS_PER_DAY`) that disagreed with the engine's correct `addDaysInTz` version. Fixed by surfacing `primaryPlanId`/`primaryPlanName` from `computeAthleteMetrics` and **deleting the dashboard-local copies** (one source of truth; removes the DST bug + a double primary-plan computation). NOTE: this did NOT collapse the 2× window load — see PERF-001 in `deferred.md`.
- **QA-METRICS-4 (WARNING):** in-progress `PerformedSession` (startedAt, no completedAt) could yield 0/negative `daysSinceLastActivity`. Fixed: last-activity uses `completedAt` only; `daysSinceLastActivity` clamped `>= 0` (+ contract `.nonnegative()`).
- **QA-UI-1 (CRITICAL — crash/injection):** `mailto:` was built by raw string concat (no `encodeURIComponent`) — athlete-controlled email enabled header/recipient injection + un-encoded breakage. Fixed: encode each address (batch + drawer single).
- **UX-002 (WARNING):** time-ago rendered as an absolute timestamp. Fixed: `formatTimeAgo` in `@repo/shared`, used on the 3 surfaces.
- **UX-001 (WARNING — user #1 priority, batch-first):** Today roster had select-all-only; no batch-from-rest. Fixed: per-row hover-reveal checkbox so a coach can start a subset selection directly.
- **UX-003 (WARNING):** resolve modal dropped the athlete/type/time-ago context line. Fixed: header context line restored.
- **UX-004 (WARNING):** drawer head led with email, not the display name. Fixed: name leads, email secondary.
- **QA-METRICS-3 (WARNING — investigated):** partial multi-session day classifier verified; the day-granular streak vs session-granular `missedCount` semantics were confirmed acceptable as-is (no spurious behavior on the covered cases).

Verification at close: `check-types` clean, scoped jsdom + `@repo/shared` + contracts tests green. The api-server suite is the gated owner ritual (NOT run — see deferred).

---

## 5. Deferred follow-ups + owner-owed (full disposition in `deferred.md`)

- **PERF-001** — `getDashboard` runs the heavy batched window load 2× per cold-cache request (reconcile path `computeMissedWorkoutsConditions` + the metrics-slice path each call `loadScheduleWindow`). O(1) round-trips (not N+1), 60s-cached, but a literal 2× of the page's most expensive part on every cold load / post-write refetch. Fix = share the loaded window or a request-scoped memo. CODE-001's fix reduced the duplicate primary-plan compute but did NOT collapse the double window load.
- **QA-METRICS-2** — multi-active-plan metric aggregation is a UNION across all active plans (adherence, missedCount, today-status, the roster workout sums) → possible double-count for an athlete on 2+ plans; `currentWeek/totalWeeks/primaryPlan` already pick a single primary. Owner domain call: union vs primary-plan-only. Documented by a (to-write) two-active-plan test; uncovered today.
- **HEALTH-CHIP-FROM-MESSAGE** (review X1 / QA-UI-4) — the dashboard action-card health chip is recovered by substring-matching the message via `getHealthChipFromMessage` (the trimmed `dashboardActionItemSchema` carries `type/severity/message`, NOT `healthStatus`). Pre-existing helper, newly consumed on the dashboard; fragile to copy/i18n change + latent false-positive. Fix = carry the typed health status on the action-item contract.
- **OWNER-OWED — api-server gated test acceptance.** The new coach-metrics unit tests + the dashboard/detail/resolve/notes/profile/missed-conditions integration tests + the new `schedule-helpers.ts` chain fixture builders are written but NOT run (per project rule, any `@repo/api-server` test run is the gated owner ritual: `db:reset && pnpm --filter @repo/api-server test`, ~10 min live Neon). The headline perf invariant (no N+1 / single-load) and the future-week + multi-plan + DST gaps should get query-count / forward-week / two-plan / non-UTC-tz assertions at that run.

---

## 6. Reconciliation with PR #278 (athletes-redesign) — at merge

Concurrent with this wave, PR #278 (`worktree-coach-athletes-redesign`, merged to main) ALSO redesigned the `/coach/athletes` roster + the **same** athlete-detail-drawer, embedding `gender/heightCm/weightKg/healthNote + notes + enrollments` directly in `CoachAthleteDetail` (no metrics engine). Merging main surfaced overlapping conflicts in the drawer, `getAthleteDetail`, and the `coach-athletes` contract. Owner-ratified reconciliation:

- **Drawer chrome = #278's, content = this wave's.** Adopted from #278: the header (prev/next athlete arrows + keyboard nav + "N of M" counter), the name/info plaque (avatar + name + email + health chip), and the `Tabs variant="fullWidth"` switcher with the Notes count badge. Kept from this wave: the tab CONTENT (metrics-backed Today / Plan / Notes / Health panes), the action-items block WITH inline quick-resolve (vs #278's read-only), and the footer **Message (mailto) + Open plan** (vs #278's "Telegram coming soon").
- **Feature added from #278:** plan **enrollments** with status (Active/Paused) + boarded date in the Plan tab — combined per plan with this wave's plan-discipline (progress + Week N/M). Plus the Notes tab count badge.
- **Prev/next nav source:** on `/coach/athletes` it traverses the roster (#278, unchanged); on the in-place `/coach` dashboard drawer it traverses the **current Today-tab bucket** (owner call); an athlete opened from another list degrades gracefully (no arrows).
- **Data approach unified on #278's embedded payload (approach A).** `getAthleteDetail` now supplies BOTH #278's embedded profile/notes/enrollments AND this wave's metrics. Consequently this wave's now-redundant **separate** endpoints were DROPPED: `getAthleteProfile` + its route + `coachAthleteProfile` client/hook (profile embedded), and the coach-notes `?athleteId` LIST filter + `getCoachNotesQuerySchema` + `useCoachNotes`/`useDeleteCoachNote` (notes embedded). KEPT: the notes CREATE path (`useCreateCoachNote` → invalidates the athlete-detail query so embedded `notes` refresh) — the add-note feature #278 lacked. **This SUPERSEDES §2.3's `getAthleteProfile`/notes-filter and §2.5's `coachAthleteProfile`/`useCoachNotes`/`useDeleteCoachNote`.**
- Merge verified: `git merge-base --is-ancestor origin/main HEAD` (branch fully contains main), full `check-types`/`lint`/`dep:check` green, pre-push cone (dep:check + lint + jsdom) green, drawer + dashboard jsdom suites green. PR #279 `MERGEABLE`.

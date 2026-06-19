# pre-launch item #3 — Coach enrolls athletes into a plan (from the Plan Editor) — `/feature` (full) prompt

**For the executor session.** From the **Plan Editor**, the coach enrolls athletes into the plan, sees who's enrolled, and manages the enrollment lifecycle (pause / resume / remove). This is **pre-launch scope item #3** (`docs/roadmap.md`, Block 1) — the **LAUNCH onboarding mechanism** (the demo-script's "enroll the athlete" step). **NO purchase gate** — manual enroll is the launch mechanism; billing is post-launch.

**The server, routes, and contract are ALREADY shipped — this is a CLIENT slice.** `lmsPlanEnrollmentApi` (create + pause + resume + remove + list, with all guards) and the four routes under `/api/platform/training-plans/[planId]/enrollments` exist and are tested. **There is NO Prisma change, NO contract change, NO server-endpoint change** — the gap is the api-client + hooks + the Plan-Editor UI. Wrap via **`/feature` (full)** — it spans an api-client + ~5 hooks + an enroll dialog (athlete picker + date + toggle) + the enrolled-list panel + 3 lifecycle actions, integrated into the large `plan-detail-view`. De-escalate to `small` at Gate A only if it proves trivial.

---

## 0. Two SSOTs — visual language vs domain data (governs the whole build)

- **The Claude Design prototype is the SSOT for the VISUAL LANGUAGE only** — layout, density, where the enroll affordance + enrolled list live, the dialog look, status chips, rhythm. Reproduce it faithfully, **native** (MUI 7 + `@repo/ui` + theme tokens; **NO hex, NO transplanted HTML/CSS**). Consistent with the shipped coach Plan-Editor surfaces.
- **Our contracts + `decisions.md` are the SSOT for the DOMAIN & DATA** — the enrollment fields, the lifecycle states, the guards, the boarding-car / date-thread semantics.
- **Conflict rule:** where the prototype shows something the domain can't honestly do, **THE DOMAIN MODEL WINS** — render what the contract supports in the prototype's idiom; flag the gap at acceptance. Never fabricate a field or a server capability that isn't there.

---

## 1. The design

Connect the `claude_design` MCP connector (`https://api.anthropic.com/v1/design/mcp`) — if it needs authorization, run `/design-login` (adds `user:design:read/write`). Then import the project and read **`Plan Editor.html`**:
`https://claude.ai/design/p/e559e35a-8245-42c2-b6cf-382cbbd053b4?file=Plan+Editor.html`

**Implement: енроллмент атлетов** (the enroll affordance + enrolled-athletes view within the Plan Editor — NOT the rest of the editor, which already exists). Implement it **visually faithfully but native** (MUI + `@repo/ui` + theme tokens). Owner does a side-by-side walkthrough vs the prototype at acceptance (visual fidelity is a gate) AND checks every domain state works on real data (domain completeness is the other gate).

---

## 2. What this slice is

The coach opens the Plan Editor (`/coach/plans/[planId]`, the `plan-detail-view`) and, per the prototype, sees an **enrolled-athletes** surface + an **"Enroll athlete"** affordance. Enrolling opens a dialog: **pick an athlete** from the coach's roster, **pick a boarding date** (the "boarding car"), optionally **hide the past before boarding**, confirm → the athlete is enrolled. Each enrolled athlete shows status (Active / Paused) + boarded date, with **pause / resume / remove** actions. Mobile-first (coach uses it on the floor).

---

## 3. Read FIRST — verbatim anchors (quoted from current `main`)

### 3.1 The enrollment model + contract (ALL shipped — do NOT change)

```
// prisma model PlanEnrollment (schema.prisma ~279) — @@map lms_plan_enrollments
{ id, planId, athleteId, enrolledById, boardedAt @db.Date, status EnrollmentStatus @default(ACTIVE),
  statusChangedAt, hidePastBeforeBoarding Boolean @default(false), createdAt, updatedAt, deletedAt }
//   partial-unique active index `plan_enrollment_unique_active` on (planId, athleteId) — one active enrollment per (plan,athlete)

// contracts/lms/plan-enrollment
EnrollmentStatus = ACTIVE | PAUSED | REMOVED  (+ ENROLLMENT_STATUS_LABELS)
createPlanEnrollmentRequestSchema = createPlanEnrollmentSchema.omit({ planId: true })
   => REQUEST BODY = { athleteId: cuid, boardedAt: coerce.date, hidePastBeforeBoarding?: boolean=false }   // planId comes from the route param
planEnrollmentSchema (response) = { id, planId, athleteId, enrolledById, boardedAt, status, statusChangedAt, hidePastBeforeBoarding, createdAt, updatedAt }
params: planEnrollmentsByPlanParamsSchema {planId} · planEnrollmentParamsSchema {planId, enrollmentId}
query:  getPlanEnrollmentsQuerySchema { status?: EnrollmentStatus }
```

### 3.2 The server + routes are DONE — wire the CLIENT to them

```
// api-server endpoints/lms/plan-enrollment/admin.ts — lmsPlanEnrollmentApi:
listByPlan(userId, planId, {status?})  -> PlanEnrollment[]   (verifyPlanOwnership)
create(userId, planId, data)           -> PlanEnrollment     (guards below)
pause / resume(userId, planId, enrollmentId) -> PlanEnrollment   (status transition ACTIVE<->PAUSED)
remove(userId, planId, enrollmentId)   -> void                (soft-delete -> REMOVED)

// routes (apps/platform/src/app/api/platform/training-plans/[planId]/enrollments/...):
GET  + POST   /enrollments                      (list / create)   — withCoachAuth + withAuthRateLimit(API)
DELETE        /enrollments/[enrollmentId]        (remove)
POST          /enrollments/[enrollmentId]/pause
POST          /enrollments/[enrollmentId]/resume
```

**Server guards already enforced (the UI mirrors, never re-implements):** plan must be `ACTIVE` to enroll (else `ConflictError`); `athleteId` must be an ATHLETE user; for a `COACH` actor the athlete must belong to that coach (`HEAD_COACH`/`ADMIN` bypass); an athlete already enrolled in the plan → `ConflictError` (dup-guard + the unique index).

### 3.3 The CLIENT is greenfield — what does NOT exist yet

- **NO api-client** for enrollment (`lib/api/endpoints/index.ts` has no enrollment entry).
- **NO hooks** for enrollment.
- **`athletes-roster` row/batch actions are `toast(... "coming soon")` STUBS** (`athletes-roster.tsx` `handleRowAction`/`handleBatchAction`) — that athlete-centric surface is NOT wired. **Leave it alone** (it's a separate surface; the hooks you build here will let a later wave wire it — flag that, don't do it).

### 3.4 The athlete source for the picker + the enrolled-list join

```
// apps/platform/src/lib/hooks/use-coach-athletes.ts -> useCoachAthletes() -> CoachAthleteListItem[]
//   CoachAthleteListItem = { userId, name|null, email, image, healthStatus, ..., enrollments: CoachAthleteEnrollment[], isPending, ... }
//   CoachAthleteEnrollment = { planId, planName, status, boardedAt }   // NOTE: no enrollmentId here
```

- **Picker source** = `useCoachAthletes`, **excluding** athletes already actively enrolled in THIS plan (`enrollments` has a non-REMOVED entry with `planId === planId`) and excluding `isPending` invitees. The server dup-guard is the backstop.
- **Enrolled-list** = `GET /enrollments` (returns `PlanEnrollment[]` WITH `id`/`status`/`boardedAt`/`athleteId` — `id` is REQUIRED for pause/resume/remove). **Join athlete display (name/avatar)** from `useCoachAthletes` by `athleteId` (client join, small N). The coach-roster enrollment shape lacks `enrollmentId`, so the list MUST come from `GET /enrollments`, not from the roster.

### 3.5 Where it lives + patterns to mirror

```
// apps/platform/src/modules/plan-detail/views/plan-detail-view.tsx — the Plan Editor (PageHeader + WeekNavigator + WeekGrid + modals)
//   it already wires plan status (DRAFT/ACTIVE/ARCHIVED via StatusSelectChip) + dialogs (CloneWeekModal) — mirror that modal/section idiom
```

`UserChip` (name + avatar) for athlete rows (`owner-column-avatar` — never a raw cuid). Floating labels everywhere (`mui-floating-labels-everywhere`). Optimistic or invalidate-on-success via the repo's query helpers (mirror `useUpdateTrainingPlan` / `useOptimisticMutation`). One component per file. Theme tokens only.

### 3.6 Boarding date / date-thread (D-DATE-THREAD)

`boardedAt` is the "boarding car" — the calendar day the athlete boards; `hidePastBeforeBoarding` then hides cars before it (visibility gate #1, already honored by the athlete read path). `boardedAt` is `@db.Date` (date-ONLY) — the client must send a **tz-stable calendar date** (use the repo's `formatDateParam`/`parseDateParam` date helpers seen in `plan-detail-view`, NOT a tz-baked instant — `D-TT-DATES-ABSOLUTE`). Sensible default = today (the coach can move it). `hidePastBeforeBoarding` = an optional toggle, default off.

---

## 4. Scope (the vertical slice)

### A. [API-CLIENT] `lib/api/endpoints/plan-enrollment.ts` + barrel

`createPlanEnrollmentAPI(client)` with `listByPlan(planId, {status?})`, `create(planId, body)`, `pause(planId, enrollmentId)`, `resume(planId, enrollmentId)`, `remove(planId, enrollmentId)` — hitting the §3.2 routes. Wire into `lib/api/index.ts` + `lib/api/endpoints/index.ts` + `lib/api/keys.ts` (a `planEnrollments(planId)` query key).

### B. [HOOKS] `lib/hooks/use-plan-enrollments.ts`

`usePlanEnrollments(planId, {status?})` (query) + `useCreateEnrollment(planId)` / `usePauseEnrollment(planId)` / `useResumeEnrollment(planId)` / `useRemoveEnrollment(planId)` (mutations, invalidate the plan-enrollments key on success; mirror the repo's mutation idiom). Barrel-wire.

### C. [UI] enroll surface in the Plan Editor — `plan-detail/components/` + integrate into `plan-detail-view`

Per the prototype:

- **Enrolled-athletes panel/section** — each row = `UserChip` (athlete name + avatar, joined per §3.4) + status chip (Active / Paused via `ENROLLMENT_STATUS_LABELS`) + boarded date (tz-stable display) + a row actions menu (**pause** when ACTIVE, **resume** when PAUSED, **remove**). Empty state ("no athletes enrolled yet").
- **"Enroll athlete" dialog** — athlete picker (Autocomplete over the filtered roster per §3.4, `UserChip` options) · **boarding date** picker (required, default today, tz-stable) · **hide past before boarding** toggle (optional, default off) → `useCreateEnrollment`. Surface the server `ConflictError` (already-enrolled / plan-not-active) as a friendly inline message.
- **Plan-ACTIVE gating** — the server requires `plan.status === ACTIVE` to enroll; the UI disables/explains the enroll affordance when the plan is DRAFT or ARCHIVED (don't let the coach hit a guaranteed `ConflictError`).
- **remove confirmation** — removing is soft-delete but pulls the plan from the athlete; confirm before calling `useRemoveEnrollment`.

---

## 5. Sacred / constraints + build decisions (ratified)

- **D3-CLIENT-ONLY** — server / routes / contract are DONE; this slice is api-client + hooks + Plan-Editor UI. **NO Prisma, NO contract, NO server-endpoint change.** If you think the server needs a change (e.g. embedding athlete display in the list response), STOP and flag it — the default is the client join (§3.4).
- **D3-PLAN-CENTRIC** — enroll lives in the **Plan Editor** (`plan-detail-view`), per the design. The `athletes-roster` "coming soon" action stubs (§3.3) stay untouched — they're a separate athlete-centric surface; the hooks built here enable wiring them in a later wave (flag in close-out, don't build).
- **D3-PICKER-FILTER** — the athlete picker = `useCoachAthletes` minus already-enrolled-in-this-plan minus `isPending`. Server dup-guard + unique index are the backstop.
- **D3-PLAN-ACTIVE** — enroll only when `plan.status === ACTIVE`; UI gates the affordance on the other statuses (server enforces `ConflictError`).
- **D3-BOARDING-TZ** — `boardedAt` is a tz-stable calendar date (`@db.Date`); use the repo date-param helpers, NOT a device-tz instant (`D-TT-DATES-ABSOLUTE` / `D-SD-DATES`). `hidePastBeforeBoarding` optional toggle, default off (D-DATE-THREAD).
- **Theme tokens only — no hex, no transplanted HTML** (`no-hex-outside-theme`, `pattern-compliance`). **`UserChip` for athletes (no raw cuid). Floating labels. One component per file. Mobile-first.**
- **Reuse the plan-detail modal/section idiom** (CloneWeekModal, StatusSelectChip) — don't reinvent dialog/menu primitives.

---

## 6. Out of scope (other waves — do NOT build here)

- **Server / contract / Prisma** — all shipped; this is client-only.
- **Wiring the `athletes-roster` athlete-centric actions** (pause/resume/remove/move/message/note "coming soon") — separate surface; the new hooks enable it later. Flag, don't build.
- **Batch enroll / move-to-plan** — unless the prototype shows it; single-athlete enroll is the launch need.
- **Purchase / billing gate on enroll** — post-launch (manual enroll IS the launch mechanism).
- **The rest of the Plan Editor** (week/day/schema authoring) — already exists; only the enroll surface is in scope.

---

## 7. Acceptance

- In the Plan Editor on REAL data: the coach enrolls a roster athlete (picker excludes already-enrolled), picks a boarding date (default today, tz-stable), optionally hides the past, confirms → the athlete appears in the enrolled list (Active + boarded date); the athlete's plan-timetable reflects the enrollment (and the date-thread hides the past when the toggle was on).
- **Lifecycle works**: pause → Paused chip; resume → Active; remove (with confirm) → drops from the list. Each reflects after the mutation.
- **Guards surface gracefully**: enrolling an already-enrolled athlete or on a non-ACTIVE plan shows a friendly message (not a raw error); the enroll affordance is gated on plan status.
- Athlete rows use `UserChip` (name + avatar), never a raw id. Dates are tz-stable.
- Owner side-by-side walkthrough: visual fidelity holds AND every domain state works on real data.
- `check-types`, `lint`, `pnpm dep:check` clean. Client-only → the gated api-server suite is untouched (the enrollment endpoints already have their tests) — note that in the PR. Close-out docs land **in** the feature PR (`closeout-before-pr`); ratify the D3-\* decisions; flag the athletes-roster wiring carry-forward.

---

## 8. Process

`/feature` (full; de-escalate to `small` at Gate A only if trivial). `db:reset` world, no migration files (no schema change). Orchestrator reviews every implement wave via `git diff` (never agent self-report). Worktree run — heed the worktree gotchas (`worktree-feature-run-gotchas`: format-lint hook cwd misfire; api-server tests need a manual `.env` copy + `DATABASE_URL` — though this client-only slice shouldn't need them). Land close-out IN the PR. ≤1 full `/feature` per session.

# athlete-core — block 2 (athlete UX) — Claude Design brief

Owner-run UI wave. Hand this brief to Claude Design with the repo link (main). The data contracts are already shipped (block 1, in main) — design on MOCKS typed against them; touch no backend.

---

## Product & user

A CrossFit coaching platform (`the-discipline-program`, Next.js App Router + MUI 7, monorepo). This is the **athlete side** — the role zone at `/athlete` in `apps/platform`. The athlete follows a training plan his coach built, logs what he did, and sees his records.

**Core metaphor — "plan as a train":** the plan runs on a timetable; the athlete is a passenger; each training session is a "car". He walks the train freely — forward or back — and can do any car whenever. The plan/timetable does not bend to him (that's a billing concern, not here).

**He's on his phone at the gym. Mobile-first, fast, low-friction.**

## What to design (athlete zone only)

1. **Plan timetable (home)** — his plan as a schedule.
2. **Session / workout view** — the contents of one car.
3. **Logging** — recording that he did it (and a benchmark result).
4. **Records & profile** — his bests, history, and the data that powers load resolution.

## Per screen

### 1. Plan timetable (home)

- The athlete's enrolled plan rendered as a **schedule/timetable** (weeks → days → sessions). Today is the anchor; he scrolls forward and back freely.
- Each session card shows: day/date, title, and a **status** — "done" or not. The "done" tick is **sticky** (set the first time he completes it, never reverts).
- **Date-thread:** the coach may hide everything before a boarding date — those past cars simply don't appear. Default: the whole plan is visible. (Future is never hidden.)
- Tap a session → the session view.

### 2. Session / workout view (read-only plan content)

- The session's structure: blocks → schemas (workouts) → rows (exercises). The athlete reads it; he doesn't edit the plan.
- Each exercise row shows: movement, reps, **prescribed load**, intensity, tempo, notes. Load has resolution states (see "Load resolution" below) — design for all of them.
- A **benchmark** schema wears a **green chip** ("benchmark" + its result type). It tells the athlete "this one is graded — log a result."
- Primary action: **"Mark completed"** for an ordinary session; **"Log result"** when the session/schema is a benchmark.

### 3. Logging (the 30-second floor)

- **Ordinary session = ONE tap** — "completed". Optional note. That's it. No per-exercise logging.
- **Benchmark = one extra step** — enter the result, typed by its result type (design an input per type): **time** (mm:ss), **rounds + reps** (two numbers), **load** (kg), **max reps** (number), **distance** (number + m/km), **calories** (number). Optional note.
- Keep it a bottom sheet / single modal — not a multi-step wizard.
- The start/log button **never disappears** — he can re-do a session any number of times. A repeat benchmark logs a new result (history); his record updates only if it beats the old one.

### 4. Records & profile

- **Records list:** his 1RMs (per exercise) and his benchmark bests. Each shows the current **best**, with a **PR** badge when freshly beaten.
- Tap a record → its **history / PR graph** over time (direction matters: for time, lower is better; everything else, higher is better).
- **Set 1RM:** add/update a 1RM manually — reachable both here and inline from a workout (see resolution).
- **Profile:** bodyweight; and the athlete's **profile picks** (for load grids — which cell is "his"), remembered.
- (A cross-athlete **leaderboard** is a later wave — do NOT build it now.)

## Load resolution (the load the athlete actually sees) — design every state

The coach prescribes load abstractly; the athlete should see a concrete number, HWPO-style:

- **Absolute / bodyweight** → just the kg.
- **Percentage of 1RM** → if he has a 1RM for that lift, show the **kg**. If not, show the **%** plus an inline **"set your 1RM"** affordance — he sets it on the spot, and it immediately becomes kg.
- **Profile grid** (e.g. RX/Scaled × M/F, with different kg per cell) → if his profile pick matches, show **his cell's kg**. If he hasn't picked, show a **"pick your profile"** affordance (choose his cell once; remembered after).
- Design the "resolved kg", "needs 1RM", and "needs profile pick" states cleanly — they're the everyday case, not edge cases.

## Data shapes — mock against these (already in the repo, `packages/contracts/src/entities/lms/`)

- **Result types:** `_shared/result.ts` (the 6-type union + directions).
- **Logging:** `performed-session/`, `performed-schema-result/` (the result attaches to a schema).
- **1RM:** `one-rm-record/` (history; current = the max).
- **Enrollment + date-thread:** `plan-enrollment/` (`hidePastBeforeBoarding`).
- **Benchmark marker:** `composition/composition.schema.ts` (`composition.benchmark.resultType`).
- **Plan content** (for the session view): `training-plan/`, `week/`, `day/`, `session/`, `block/`, `schema/`, `schema-row/`, `composition/`, `_shared/load.ts`, `_shared/intensity.ts`.
- **Resolver states** (resolved kg / needs-1RM / needs-profile-pick / n-a): `packages/api-server/src/endpoints/coaching/athlete-records/athlete-records.types.ts`.

## Design direction

- **MUI 7 + the project theme.** Use theme tokens for everything (color, spacing, typography) — **no hex literals, no ad-hoc colors**. The green benchmark chip uses the theme's semantic green.
- **Match the coach zone** (`/coach`, already redesigned) — same visual language, components, and density. Reuse `@repo/ui` primitives.
- **Mobile-first** — this is the only zone an athlete uses, mostly on a phone mid-workout. Big tap targets, fast paths, minimal typing.
- **Plan-as-train** should read in the timetable's feel — a schedule he rides, not a generic calendar grid.

## Boundaries

- **Mock data only.** The backend, API routes, and contracts are done and merged — do not change them. Type mocks against the contract entities above.
- **Athlete zone only** (`/athlete`). No coach/admin screens.
- **UI/UX only** — no API, Prisma, or contract changes.
- **Out of scope** (other waves): cross-athlete leaderboard, per-exercise actual logging, plan publish flow (coach-side), the benchmark/template/profile catalog.

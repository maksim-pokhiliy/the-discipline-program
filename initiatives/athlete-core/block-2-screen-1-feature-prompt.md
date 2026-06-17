# athlete-core — block 2, screen 1 (Plan Timetable) — `/feature` (full) prompt

**For the executor session.** A cross-layer vertical slice for ONE screen: the athlete plan timetable, on real data. The design is owner-approved (Claude Design). Wrap via `/feature` (full — it spans contract + read endpoint + hook + UI + page).

## The design (implement faithfully, through OUR system)

Import the Claude Design project via the connector: `https://claude.ai/design/p/13bb3ca7-bce0-49d7-be98-750709a1e2e9?file=Plan+Timetable.dc.html` → read `Plan Timetable.dc.html`.

**Implement it visually faithfully — but as a NATIVE build, not an HTML transplant.** Translate the prototype into the project's stack: MUI 7 components, `@repo/ui` primitives, theme tokens for every color/spacing/typography value. NO hex literals, NO ad-hoc inline colors, NO copied raw HTML/CSS. The result must look like the approved design AND read like the rest of the codebase. (Owner does a side-by-side walkthrough vs the prototype at acceptance — visual fidelity is a gate.)

## What this slice is

The athlete opens `/athlete` and sees his enrolled plan as a schedule he rides (plan-as-train): weeks → days → sessions, today anchored, each session a card with a sticky done/not status, free scroll both ways, past hidden when the coach set the date-thread.

## Read FIRST (trust these; verbatim quoted inside)

1. The approved design (above) — the visual + interaction target.
2. `initiatives/athlete-core/decisions.md` — D-LAYERS (free navigation), D-STATS (sticky-first done), D-DATE-THREAD (optional hide-past).
3. Contract entities (mock/real shapes): `packages/contracts/src/entities/lms/{training-plan,week,day,session,plan-enrollment,performed-session}/`.
4. The existing READ-endpoint + page patterns to mirror: the coach `plan-detail` read path (aggregate plan tree) and a `/coach` page; the read-route helper (`createAuthGetHandler` family) + `withAthleteAuth`.

## Scope (the vertical slice)

- **Read endpoint** — `GET api/platform/athlete/...` (timetable), `withAthleteAuth`. Returns the athlete's ACTIVE enrollment's plan as a tree: plan title → weeks (order, startDate) → days (order, label) → sessions (id, order, title) — each session carrying a derived **done** flag. Apply the **date-thread**: when `hidePastBeforeBoarding`, drop sessions dated before `boardedAt`. **Done = a PerformedSession exists for (sessionId, athleteId)** — fetch them in ONE batched query and resolve in-memory (mirror the coach-metrics `PerformedByKey` pattern; NO N+1). No active enrollment → an empty shape the UI renders as the empty state.
- **Contract** — the timetable response schema (mirror an existing aggregate read response; a new athlete-facing read entity or an `-api` schema).
- **Client hook** — a TanStack query hook + endpoint client (mirror the existing athlete hooks `use-performed-sessions` etc.).
- **UI** — the timetable screen from the design: week/day grouping, session cards, today anchor, done marks, free vertical scroll, the empty state. One component per file; compose from `@repo/ui` + MUI; theme tokens only.
- **Page** — wire it at the athlete home route (`apps/platform/src/app/athlete/`).

## Sacred / constraints

- **Visual fidelity to the approved design** — but via MUI + `@repo/ui` + theme tokens. No hex, no inline ad-hoc styling, no transplanted HTML (`no-hex-outside-theme`, `pattern-compliance`).
- **One React component per file.**
- **Mobile-first** — phone at the gym; big tap targets, glanceable.
- **Sticky done** (D-STATS): one-or-more PerformedSession ⇒ done, and done never reverts.
- **Free navigation** (D-LAYERS): scroll past and future; the date-thread is the ONLY thing that hides cars, and only the past.
- **No N+1** in the status derivation — one batched performed-sessions query.
- Tap a session card → a navigation target for the session view (screen 2, next) — a pressed/route affordance, don't build the session view now.

## Out of scope (other screens/waves)

Session/workout view, logging, records, profile (screens 2–4) · the load resolver UI (rides the session view) · plan publish · leaderboard · per-exercise logging.

## Acceptance

- An enrolled athlete sees his plan timetable on REAL data; today anchored; done marks correct and sticky; the date-thread hides the past when set; empty state when not enrolled.
- Owner side-by-side walkthrough vs the prototype — visual fidelity holds.
- The read endpoint is tested (gated api-server suite green on reseed); `check-types` + `lint` clean.
- Close-out docs land IN the feature PR.

## Process

`/feature` (full), one screen. `db:reset` world, no migrations. Orchestrator reviews via `git diff`, never agent self-report. ≤1 full `/feature` per session.

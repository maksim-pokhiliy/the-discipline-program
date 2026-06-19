# Roadmap — the-discipline-program

> **Mission.** Ship the MVP: a CrossFit coach (Denys) programs training cycles in our constructor faster than his Excel, his athletes follow the plan, log results, and see their records. Launch is a **closed, demo-driven onboarding** of Denys himself; paid self-serve onboarding follows once a second coach is in sight. Everything below is the path from **today** to that launch. Nothing more.

**Owner:** Maksim. **Reviewed:** at the start of every working session (this file is the top of the planning stack — see `docs/process.md`).
**Last synced:** 2026-06-19.

---

## Where we are now (honest snapshot)

- **Monorepo is mature:** 3 apps (marketing / platform / admin), contracts / api-server (Prisma) / api-client / query / auth (next-auth) / ui / mui — all real. Upstash ratelimit + redis, Sentry wired.
- **The session primitive is FROZEN and PROVEN.** `primitive-spec.md` is frozen; `primitive-v2` (the reshape — cross-cutting `cap`, intensity trinity, interval `{value,unit}`, nested `byProfile`) is merged (#282). The **e2e evil corpus is PASSED**: the owner hand-built all three maximally-evil CrossFit sessions on a bare DB with **zero ❌** — including the two former gaps (cap-on-a-ladder, Tabata sub-minute interval) that primitive-v2 closed. The model holds Games-level programming. (`session-primitive` Phase-1 gate met → ready for its `/initiative-close`.)
- **Coach station is substantively complete:** clone week/day/block, coach profile, authoring inline-create, the `/coach` dashboard + athletes redesigns — all merged. Programming-faster-than-Excel is demonstrable (the evil corpus built in ~10–12 min/session). **Coach enrollment (Block-1 #3) is shipped** as a client slice over the frozen `lmsPlanEnrollmentApi` (strip + manage-modal in `plan-detail-view`). Ratified reconciliations: the list is **LIVE-only** (Active/Paused groups; the soft-delete extension hides REMOVED, so re-enroll happens through the picker, not an in-list action); **no "edit boarding"** (no server endpoint); enroll is **gated to ACTIVE plans** (pause/resume/remove stay live on any status); `boardedAt` is sent + displayed **tz-stable** (UTC calendar date, no off-by-one); multi-select enroll is a client `Promise.allSettled` loop (the server `create` is single-athlete). **Carry-forward:** the `athletes-roster` row/batch actions (pause/resume/remove/move/message/note) are still `coming-soon` stubs — the enrollment hooks shipped here (`usePauseEnrollment` / `useResumeEnrollment` / `useRemoveEnrollment`) now let a later wave wire that athlete-centric surface.
- **Athlete core is SHIPPED — all four athlete-UX screens (block 2 DONE).** block-1 data core (#283); Plan Timetable (#284); Session/Workout View + in-schema benchmark logging (#285); **Records / PR-history (#288)** (best-of per 1RM + per benchmark, direction-aware, per-`plannedSchemaId`, trend + history); **Profile (#286)** (bodyweight + height hero-stats, profile-picks overview/clear, avatar upload, editable gender/health). **The athlete training screen works end-to-end** — read-only plan content, all 4 `ResolvedLoad` states, inline set-1RM / pick-profile, and **athlete-owned, append-only benchmark logging decoupled from completion** (a re-log is a new attempt; logging never flips the done tick; a `load` log writes `OneRMRecord` atomically and resolves the % rows below it). Working-weight `%` resolves off the **latest** 1RM (current form); records/PR stay best-of. The next athlete-side wave is block 3 — coach honest-metrics (post-launch trigger).
- **Marketing lead-capture is shipped (#287):** the storefront "get this plan" CTA opens a lead form (the chosen program carried under the hood) → a durable `MarketingContactSubmission` + a best-effort email-notify to the head coach (Resend); no checkout (billing is post-launch); the generic `/contact` flow is untouched.
- **Deliberately deferred from launch:** payments (no provider wired — launch enrolls athletes by hand); production prod-hardening (GDPR/monitoring/CodeQL); lifecycle emails beyond auth basics.
- **Prod infra:** Vercel is configured for per-monorepo-app deploys (env-vars pending → build goes green once added); Neon has prod + dev branches. The prod domain is set up live with Denys on the demo call.

## The launch bar (anti-"one more feature")

**"Denys-ready" is a FIXED bar, set once, here.** The product launches when the **full demo-script runs clean on prod** — Maksim drives it on a real URL with Denys watching, and at the end Denys buys the domain handover:

> seed a coach → fill the marketing site via the admin console → invite a user by email → claim it as the athlete → as the coach build 1–2 plans / 2–4 sessions → enroll the athlete → as the athlete log a benchmark + mark a session complete → flip back to the coach and show his dashboard reflecting those actions → walk every platform + admin page (where, what, for whom) → discuss the domain; he buys, we connect it.

Payment automation is **not** in the bar — enrollment is by hand for the closed launch. Ideas that arrive after the bar is met go to the post-launch backlog, not into the launch. This is the single rule that protects the ship date.

## Operating model (how we get there without a team)

- **Maksim is the only user through launch** — coach, athlete, and admin at once. A **self-test per surface** (build it, then drive it as the user) replaces early external UAT.
- **Denys sees a finished product**, not a half-built one. His only touch before the demo is none; the demo IS the onboarding. True UAT = continuous iteration _after_ launch.
- **Manual enrollment is the LAUNCH mechanism**, not a fallback: the coach enrolls athletes into plans directly from the platform; no purchase gates access. Purchase-first onboarding is a **post-launch** concern (it lands with billing).
- **Lead-capture keeps the marketing channel open without a paywall:** a visitor who clicks "buy a plan" gets a short contact form (the plan is already chosen, carried under the hood); it notifies the head coach, who reaches out and invites by email. No checkout until billing lands.

---

## The three blocks

Work is organized as **pre-launch scope → launch (closed) → post-launch (triggered)**. Pre-launch is the fixed set that makes the demo-script run clean; launch is the demo itself; post-launch is everything gated behind a real trigger.

### BLOCK 1 — Pre-launch scope (the fixed set before the demo)

Each item has an **Outcome** (what is TRUE when done). Athlete screens are the `athlete-core` initiative; the rest are infra/coach surfaces.

| #   | Item                                                              | Outcome                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Zone                   |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1   | **Athlete Records / PR-history**                                  | ✅ **Shipped (#288).** The athlete sees his bests — 1RM per movement (history + trend) and benchmark bests per WOD (best-of, direction-aware PR, per-`plannedSchemaId`, trend chart + history). Reads the shipped `BenchmarkResult` + `OneRMRecord` history. (block-2 screen 3)                                                                                                                                                                                                                                                                                                  | athlete-core (planner) |
| 2   | **Athlete Profile**                                               | ✅ **Shipped (#286).** The athlete edits bodyweight + height (hero-stat twins), manages remembered profile picks (overview/clear), uploads an avatar (`User.image`), and edits gender/health. (block-2 screen 4)                                                                                                                                                                                                                                                                                                                                                                 | athlete-core (planner) |
| 3   | **Coach enrolls athletes into plans**                             | ✅ **Shipped (#290).** From the Plan Editor (`/coach/plans/[planId]`), the coach enrolls athletes into a plan directly (no purchase) — the launch onboarding mechanism. An enrollments strip + a "Manage enrollments" modal (multi-select roster picker, boarding date, hide-past toggle) + pause / resume / remove lifecycle.                                                                                                                                                                                                                                                   | coach platform (owner) |
| 4   | **Lifecycle email templates**                                     | Invite (works + tested) and **lead-notify to the head coach** (#287, shipped) both fire; the **password-reset email** is the one remaining piece — lands with #5.                                                                                                                                                                                                                                                                                                                                                                                                                | infra                  |
| 5   | **Password reset / recovery**                                     | A user can recover access — forgot-password flow end-to-end.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | infra (auth)           |
| 6   | **Head-coach → admin access** — ✅ **DONE** (verified 2026-06-19) | The head coach reaches the admin console to author marketing CMS content. **Role-gate already shipped**: `admin/proxy.ts` + `admin/modules/auth` admit `ADMIN`+`HEAD_COACH`; `HEAD_COACH` single-occupancy + role-lifecycle + user-creation are tested; the admin marketing-CMS (blog / pages / products / reviews / contacts CRUD, backed by `Marketing*` models) exists to author. Single user, single role, gate extended — NOT dual users. Optional micro-gap (not a blocker): no platform→admin nav link — the head coach enters by direct URL, fine for the closed launch. | auth/role              |
| 7   | **Marketing "buy" → lead-capture form**                           | ✅ **Shipped (#287).** The storefront "get this plan" CTA opens a 3-field lead form (name optional · contact required, free text · message optional; the chosen program carried under the hood) → a durable `MarketingContactSubmission` + a best-effort email-notify to the head coach. NO checkout; the generic `/contact` flow is untouched.                                                                                                                                                                                                                                  | marketing              |
| —   | **Prod env-vars**                                                 | Vercel per-app builds go green (env-vars added). Minor; not a feature.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | infra                  |

**Exit of Block 1.** Every item above is built and self-tested; the demo-script can run start-to-finish on prod with no dead end.

### BLOCK 2 — Launch (closed, demo-driven)

- **Outcome.** Denys is onboarded live: the demo-script (the launch bar) runs clean on the prod domain, every surface shown, and he buys the domain handover. His real programs start moving in.
- **Key work.** The demo call itself: domain handover, walking Denys through coach + athlete + admin, moving 1–2 real programs in by hand, enrolling his first athletes manually.
- **Exit = MVP LAUNCHED** (a real coach running a real cohort on prod, even if money still changes hands off-platform).

### BLOCK 3 — Post-launch (triggered, not scheduled)

Each item is gated behind a **real trigger**, so none of it blocks the ship date or creeps into the launch.

| Item                                                                                                                                              | Trigger                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Billing automation** (provider, purchase-first onboarding, subscription FSM, access gate, admin Subscription CRUD, `stripe*`→`provider*`)       | A **second paying coach** in sight, or public onboarding beyond Denys. Until then manual enroll + off-platform money. |
| **Coach honest-metrics** (block 3 — derived fields + reconcile cron on `performedAt`)                                                             | **First** post-launch — Denys will want to see athlete progress/compliance.                                           |
| **Benchmark / profile / template CATALOG** (admin CRUD, fusion form, save-as/use-as; re-homes `profileSelections` free-string axes → catalog ids) | When ad-hoc free-string axes start to bite (e.g. "RX" vs "Rx" mismatch in the field).                                 |
| **Plan publish / version-gate** (D-SCOPE-PUBLISH — visibility gate #2)                                                                            | When the coach needs to edit a live plan without athletes watching the edits.                                         |
| **% of bodyweight** load reference (new `percentageReference` scope `"bodyweight"` — primitive + resolver + coach editor + render, together)      | When a coach needs sled/carry "100% BW" prescriptions (see `athlete-core/deferred.md`, D-AC-BODYWEIGHT-LABEL).        |
| **Cross-athlete leaderboard** (best-of ranked per 1RM / per benchmark)                                                                            | Surfaced scope; competitive feature, not MVP-blocking.                                                                |
| **Granular admin scoping** (head coach → CMS-only, not full admin)                                                                                | A **second** coach (then one coach must not see another's data/users).                                                |
| **Prod hardening** (GDPR/data-deletion, monitoring best-free, CodeQL/Dependabot)                                                                  | Before opening past the closed cohort.                                                                                |

---

## Explicitly OUT of the MVP (v1.1+)

Gym-floor PWA · periodization above Week (micro/meso/macro) · weekly-summary + action queue · advanced analytics · military-rehab UI · Telegram · pause UI · Excel tooling · MFA · **DnD group-creation** (dropped from coach-station, D-11) · per-exercise actual logging (post-MVP, D-LOGGING-MINIMAL) · in-workout timers / scoring engine. These are real and wanted — they are _after the bar_.

## Fixed decisions (don't re-litigate)

- **Billing is post-launch** (manual enrollment is the launch mechanism; automation triggers on a second paying coach). 30-day access window, re-subscribe, manual activate — all ride the post-launch billing wave.
- Benchmark result = **athlete-owned, append-only history** (`BenchmarkResult`), decoupled from completion; a re-log is a new attempt (D-BR-OWNED-HISTORY). Working-weight `%` resolves off the **latest** 1RM; records/PR are **best-of** (D-1RM-LATEST — two laws, two layers).
- The corpus (Denys's plans) is the FLOOR of expressiveness, not the ceiling — group-programming notations (m/f, RX/SC) are first-class despite low corpus cardinality.

## Cross-references

athlete-core detail → `initiatives/athlete-core/`. Phase-1 primitive proof → `initiatives/session-primitive/e2e-evil-corpus.md`. Architectural decisions → `docs/adr/`. Personas → `docs/personas/denys.md`. The plan-as-train domain metaphor and the coach-daily-UX priority govern every block. How we execute → `docs/process.md`.

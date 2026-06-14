# Roadmap — the-discipline-program

> **Mission.** Ship the MVP: a CrossFit coach (Denys) programs training cycles in our constructor faster than his Excel, his athletes follow the plan, log results, and see their records — and he pays for it. Everything below is the path from **today** to that launch. Nothing more.

**Owner:** Maksim. **Reviewed:** at the start of every working session (this file is the top of the planning stack — see `docs/process.md`).
**Last synced:** 2026-06-14.

---

## Where we are now (honest snapshot)

- **Monorepo is mature:** 3 apps (marketing / platform / admin), contracts / api-server (Prisma) / api-client / query / auth (next-auth) / ui / mui — all real. Upstash ratelimit + redis, Sentry wired. Dev DB on Neon (`db:reset` world, no migrations yet).
- **The session primitive is being rebuilt** (`initiatives/session-primitive`): the model the coach authors a workout in. **W1 → W4-editor all merged** (PRs #261–#265) — the W4 row-grammar model + the coach authoring page are built. The **W4E live-test follow-ups** (tempo smart-union, schema-group create-as-rows, in-group drag + DnD polish, session-with-block, row-summary chips) are in **PR #268** (awaiting the gated suite + browser walkthrough). `primitive-spec.md` is FROZEN (zero open grid rows). The **catalog pass** is the immediate next build.
- **Known-wrong, deliberately deferred:** `Performed*` / `OneRMRecord` (athlete logging + records) are stubs from before the rebuild — redesigned in Phase 3 against the frozen primitive, not patched now.
- **Not started:** payments (no provider wired), production infra (Vercel/Neon-prod not configured), lifecycle emails beyond auth basics.

## The launch bar (anti-"one more feature")

**"Denys-ready" is a FIXED bar, set once, here.** The product launches when a real coach can run a real paid cohort through the happy path:

> bought on marketing → account → platform → trained → logged · and the coach _programmed a cycle faster than Excel_.

Ideas that arrive after the bar is met go to the post-launch backlog, not into the launch. This is the single rule that protects the ship date.

## Operating model (how we get there without a team)

- **Maksim is the only user until Phase 7** — coach, athlete, and admin at once. A **self-test per phase** (build it, then drive it as the user) replaces early external UAT.
- **Denys sees a finished product**, not a half-built one. His only early touch is merchant paperwork (starts at Phase 5). True UAT = continuous iteration _after_ launch.
- **Purchase-first onboarding** is canon: buying creates the account; the athlete claims it via an invite token.
- **Manual billing is the Plan B** that de-risks the launch: an admin can activate a subscription by hand if the automated provider slips.

---

## Phases

Each phase has an **Outcome** (what is TRUE when it's done) and an **Exit** (the demonstrable gate). Phases are sequential; the Exit of one is the Dependency of the next.

### Phase 1 — Primitive freeze · the coach can author ANYTHING ⟵ _in flight_

- **Outcome.** The coach can express any workout he writes — including a maximally-evil CrossFit session — in the constructor, and read it back unambiguously. The model has zero parsing-residue debt.
- **Key work.** `session-primitive` W4 (the row-grammar model + the coach-platform authoring page — DONE, PRs #264/#265 + the W4E follow-ups in PR #268) → the **catalog pass** (equipment library, exercise nature `concrete|placeholder|rest`, drop dead movement-type tags) → reseed.
- **Exit (self-test).** The orchestrator writes the hardest CrossFit workouts (the A–E evil fixture + more); Maksim builds each one **by hand in the UI** with no model gap. `primitive-spec.md` stays frozen; gated suites green on a reseeded DB.
- **Status.** W4-model + W4-editor MERGED (PRs #264/#265); the W4E live-test follow-ups are in PR #268 (tempo smart-union · schema-group create-as-rows · in-group drag + DnD polish · session-with-block · row-summary chips). Next: the **catalog pass** (equipment library + `concrete|placeholder|rest` nature enum + drop dead movement-type tags) → reseed → the e2e self-test (build the evil A–E fixtures by hand).

### Phase 2 — Coach station complete · programming is faster than Excel

- **Outcome.** The coach's daily surface is fully usable and genuinely faster than his spreadsheet — the explicit promise of the bar.
- **Key work.** Reuse features (clone week / day / block, saved compositions) — the persona's pain #1; coach profile UI; the authoring-flow polish surfaced during Phase 1's self-test (incl. the LABEL-FLOW-UX searchable create-on-the-fly picker, shared with the row-modifier picker). The owner-requested **DnD group-creation** (create groups by dragging schema-onto-schema / row-onto-row + drag-in / drag-out) belongs here too — it pairs naturally with the clone/duplication work (both manipulate whole subtrees); see `initiatives/session-primitive/deferred.md` → DND-GROUP-CREATE.
- **Exit.** Maksim programs a full multi-week cycle end-to-end, timed, and it beats the Excel baseline.

### Phase 3 — Athlete core + honest coach metrics

- **Outcome.** An athlete opens the app, sees the plan as a timetable (plan-as-train), logs a session in seconds, and sees benchmarks + records; the coach sees honest derived metrics.
- **Key work.** **Redesign `Performed*` / `OneRMRecord` / scoring FROM SCRATCH** against the frozen primitive's repetition kinds — a mini design-cycle (initiative) _before_ contracts. Athlete plan view; result logging (post-workout, no in-workout timers — "the laziest athlete does it in 30 seconds"); 1RM history; benchmark catalog (seed ≥25) + results; records + PR graph; coach `/athletes` derived-field wire-up + reconcile cron.
- **Exit.** Maksim-as-athlete logs a week against a Maksim-as-coach plan; records and coach metrics reconcile correctly.

### Phase 4 — Lifecycle infrastructure

- **Outcome.** The account lifecycle is production-shaped: people can recover access, get the right transactional emails, and complete their profile.
- **Key work.** Forgot-password; the core sync email templates (weekly-summary + queue are CUT to v1.1); bounce-lite; profile-completion onboarding; first-admin bootstrap.
- **Exit.** A fresh account goes signup → verify → profile-complete → receives the right emails, no dead ends.

### Phase 5 — Monetization

- **Outcome.** Money works end-to-end, with a manual fallback so a provider hiccup can't block launch.
- **Key work.** Wire the payment/UA provider at implementation time (supersede ADR-0014); canonize purchase-first onboarding (purchase → account → claim via invite token); webhook + idempotency (the idempotency layer already exists since W2); subscription FSM + enrollment coupling; access gate; **admin Subscription CRUD + manual activate = Plan B**; rename `stripe*` → `provider*`.
- **Exit.** A test purchase creates an account, grants access, and an admin can also activate a subscription by hand.

### Phase 6 — Production assembly + rehearsal

- **Outcome.** The whole thing runs on production infra and a full happy-path has been rehearsed on a real URL.
- **Key work.** Vercel ×3 + Neon prod + the migrations switch (ADR-0019) + monitoring (best-free) + CodeQL/Dependabot + GDPR/data-deletion. **Dress rehearsal:** the entire happy path on the production domain.
- **Exit.** The bar's happy path runs green on production, observed.

### Phase 7 — Denys onboarding & true UAT (LAUNCH)

- **Outcome.** Denys is live: his real programs are in the system, he's running ≥5 paid athletes, and we iterate on real usage.
- **Key work.** Domain handover; training calls to move his programs in by hand; ≥5 paying athletes; a **2–4 week iteration runway with ZERO new features** — only fixing what real usage surfaces.
- **Exit = MVP LAUNCHED.**

---

## Explicitly OUT of the MVP (v1.1+)

Gym-floor PWA · periodization above Week (micro/meso/macro) · weekly-summary + action queue · advanced analytics · military-rehab UI · Telegram · pause UI · Excel tooling · MFA · the `Performed*` redesign's nice-to-haves beyond logging. These are real and wanted — they are _after the bar_.

## Fixed decisions (don't re-litigate)

- 30-day access window = 30 days from purchase; re-subscribe any time, history preserved.
- Benchmark seed = 25. PAUSED lives on `EnrollmentStatus` (NOT on `Subscription`). Session revocation + `CRON_SECRET` already done.
- The corpus (Denys's one personal plan) is the FLOOR of expressiveness, not the ceiling — group-programming notations (m/f, RX/SC) are first-class despite low corpus cardinality.

## Cross-references

Phase 1 detail → `initiatives/session-primitive/`. Architectural decisions → `docs/adr/`. Personas → `docs/personas/denys.md`. The plan-as-train domain metaphor and the coach-daily-UX priority govern every phase. How we execute phases → `docs/process.md`.

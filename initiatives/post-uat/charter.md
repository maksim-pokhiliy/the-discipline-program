# post-uat — charter

**Goal.** Convert the July-2026 UAT feedback corpus (owner + the first real athletes) into shipped, owner-verified fixes and features — every collected item ends CLOSED (shipped + verified) or DROPPED (with rationale), nothing silently lost.

**Driving decision.** No single ADR. Driven by the UAT feedback corpus distilled in `triage.md` (every item root-caused in code, 2026-07-27). Roadmap context: post-launch hardening after the 2026-06-13 prod launch (`docs/roadmap.md`); the payments item feeds the Phase-5 billing lineage.

## Operating model (how this initiative runs)

This initiative runs as an **owner-in-the-loop grind**, not a single build arc:

- **Owner (Maksim)** — reproduces every item in the browser from the STR in `triage.md`, ratifies decisions and wave scope, carries approved prompts to executor sessions, merges PRs.
- **Tech-lead session** — keeps the registry honest: triage + root cause, STR authoring, wave cuts, executor prompts, Gate-A validation of `/feature` runs, PR review against the approved scope, surfacing decisions with a recommendation (never deciding owner-level forks silently).
- **Executor sessions (parallel tabs)** — run the approved prompts via `/feature` (full/small) or `/fix`; no self-expanded scope. Implementer self-reports are verified via `git status`/diff before the next stage (standing feedback rule).

**Item lifecycle:** `TRIAGED → REPRO'D (owner) → SPEC'D (prompt approved) → IN-EXEC → PR → MERGED → VERIFIED (owner, prod/preview) → CLOSED`; `DROPPED` possible at any stage with rationale. Registry + statuses live in `plan.md`; evidence + STRs in `triage.md`.

## Acceptance criteria

- Every PU-item in `plan.md` reaches `CLOSED` or `DROPPED`-with-rationale; shipped items owner-verified on prod (or preview where prod-gated).
- Wave 1 (athlete pack) re-verified by the athletes who reported the issues (Tetiana's flows work end-to-end).
- No gated-suite regression (api-server serial, platform runner) on any wave.
- Denys received the UAT-summary update; a payments charter exists or is explicitly parked with a reason.

## Scope

The `PU-01..PU-16` registry (`plan.md`): athlete-session UX bugs, records/1RM flow, the cardio-load semantic trap, admin user management, marketing reach (login entry point, socials), contact notifications (email + Telegram), the guided workout timer, the per-gender volume model, plus ops/investigation follow-ups surfaced by UAT.

## Non-goals

- **PU-08 (link≠publish UX)** — executes INSIDE `mobile-publish` (tracked there as **MP-22**); the registry row here is a pointer, not a second home.
- **PU-14 (self-serve plan purchase / payments)** — only chartering happens here; execution is its own future initiative once Tetiana's brief lands (roadmap Phase-5 billing; couples with athlete-core deferred "auto-create plan on personal-product purchase").
- **Legacy iOS auth unification** ("the app won't accept platform creds") — by design today; the real fix is MP-NORTH-STAR (repoint iOS at the platform API), out of scope here.
- **Marketing content production** (live social feeds, team achievements) — Denys's side, not code.

## Sacred (do not touch)

- **Prod data inviolable** (standing rule). PU-06 repro runs on the dev DB ONLY — an ADMIN-role user delete on prod would soft-delete a real user AND brick the admin users list until Fix A ships.
- **Row VO layer (`load.ts`, `reps.ts`)** — the zero-diff rule stands (profile-axis-catalog charter). PU-13 (per-gender volume) opens its own ratified design + four-projection gate before touching contracts; no executor touches these files under a generic wave prompt.
- **Mobile-publish projection byte-parity (D-17):** PU-05 mitigation must NOT change published text — `format-legacy-schema.ts` stays untouched (published spreads are unit-less and read as the coach intended; only the athlete web view invents "kg").
- **Existing initiative boards** — history is cross-linked, never rewritten.

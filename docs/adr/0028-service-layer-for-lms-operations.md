# 0028. Service layer for LMS operations (partially supersedes ADR-0017)

- **Status:** Proposed
- **Date:** 2026-04-26
- **Tags:** `architecture`, `lms`, `services`

## Context

ADR-0017 accepted an anemic domain model for the project's pre-product phase. The trigger conditions for revisiting were spelled out: extract a service layer when an operation is called from two or more endpoint files, when an endpoint exceeds ~300 lines, when a transaction spans multiple aggregates, or when a scheduled job needs the same logic as an HTTP handler.

The LMS redesign (ADR-0027) trips all four triggers at once.

- **PR detection** is fired from `SetLog` writes during athlete logging (M3 athlete UX), from manual `Benchmark` upserts (M1 coach action), and from a nightly recompute job (M2 analytics). Three call sites, identical logic. Inlining the same Prisma write three times invites drift.
- **Weekly volume aggregation** runs both on `WorkoutSession.complete` (incremental UPSERT) and as a scheduled cron pass over the trailing 8 weeks (full recompute). Two call sites, one of them is a queue consumer with no HTTP request.
- **Plan snapshot creation** for the duplicate-plan endpoint spans `TrainingPlan`, `Week`, `Day`, `Session`, `Block`, `BlockSegment`, `SetGroup`, `ExerciseEntry` — eight aggregates inside a single transaction. That orchestration cannot fit cleanly inside any single endpoint handler.
- **Program parser** (M2) is a multi-pass pipeline (tokenize → detect weeks → detect days → detect blocks → detect schemes → match exercises → build draft) that has no business logic relationship with HTTP concerns. It must run from an endpoint, from a CLI tool used by coaches with large back-catalogues, and from automated tests against the Discipline corpus.

ADR-0017's anemic-by-default model still fits the rest of the project (IAM, billing, marketing, CMS, storage) where endpoints are direct CRUD. The decision here is scoped: introduce a service layer for LMS operations, leave the rest of the codebase as-is.

## Decision

We create `packages/api-server/src/services/lms/` as a flat module of plain async functions. Each function takes its dependencies as arguments — explicitly the Prisma client (`db: PrismaClient`) and any pure inputs — and returns a typed result. There is no DI framework, no interfaces-as-ports, no class hierarchy. Endpoints call services; services call Prisma.

Initial M0 skeletons:

- `pr-evaluator.ts` — `evaluatePr({ db, setLogId })` — signature only, throws "not implemented" until M2.
- `weekly-volume-aggregator.ts` — `aggregateWeeklyVolume({ db, userId, weekStartDate })` — signature only, throws "not implemented" until M2.

M1 will add:

- `plan-snapshot-creator.ts` — `clonePlan({ db, sourcePlanId, newName, creatorId })` — used by duplicate-plan endpoint and the seed.
- `library-search.ts` — `searchExercises({ db, query, filters, scope, viewerId })` — used by the inline `@` picker, the library list, and import parser exercise matching.

M2 will add:

- `program-parser/` — `parseProgramText({ text, libraryMatcher })` — multi-stage pipeline.

Services do not own transactions automatically. When a service needs a transaction, it accepts `db: Prisma.TransactionClient | PrismaClient` so it can run inside a caller-owned `prisma.$transaction(async (tx) => …)`. Endpoints that compose multiple services into one atomic operation supply the transaction client; services that are leaf operations supply nothing.

Tests sit next to the implementation as `<service>.test.ts`. They use a real Prisma client against a test database (covered by ADR-0023) — no mocks for the database layer.

## Consequences

**Positive:**

- Three caller sites for `evaluatePr` cannot drift. The same code path runs from athlete logging, manual benchmark entry, and the nightly recompute.
- The duplicate-plan endpoint becomes a five-line handler that calls `clonePlan` and maps the result. The eight-aggregate transaction lives in one auditable place.
- Cron jobs and CLI tools call the same functions HTTP handlers do, with no HTTP-context shim.
- Parser logic (multi-pass, hundreds of lines) is testable in isolation without a Next.js route handler around it.

**Negative:**

- The "endpoints call Prisma directly" pattern that holds in IAM/billing no longer holds in LMS. A reader has to recognize the boundary. Mitigated by keeping LMS service code in one folder and naming services by verb-phrase (`evaluatePr`, `clonePlan`, `parseProgramText`).
- Two-layer dispatch (endpoint → service → Prisma) adds a small amount of indirection for genuinely simple LMS CRUD (e.g., listing block kinds for a coach). We accept this — the cost is a function call, the gain is consistency within the LMS subdirectory.
- Transactions are explicit at the call site, not implicit in the service. Forgetting to wrap a multi-service call in `$transaction` is a bug class that did not exist before. Mitigated by code review and by services that mutate writing the expected transactional context in their JSDoc.

**Neutral:**

- `packages/api-server/src/services/` previously had only `iam/auth-service.ts`. Adding `lms/` does not require any DI infrastructure and does not retroactively pull other domains into the service-layer pattern.
- ADR-0017's trigger criteria still govern non-LMS code. If billing or coaching ever accumulates a multi-aggregate flow, that domain extracts its own service folder; we do not pre-build empty `services/billing/` directories.

## Alternatives considered

**Keep all logic in endpoint files.** Rejected: `pr-evaluator` would be inlined in three handlers and one cron entry point; the duplicate-plan handler would exceed the 300-line ESLint cap by week one of M1; the parser would have nowhere to live except a giant import-apply route.

**Full hexagonal architecture with ports/adapters and dependency injection.** Rejected: massive structural overhead for a project that has one team, one runtime, one database. The cost is paid upfront in indirection and ceremony; the benefit (swapping persistence) is hypothetical.

**Move all CRUD to services.** Rejected: most LMS CRUD is genuinely thin (list block kinds, fetch a plan, create a session). A service per Prisma call is a pass-through layer with no value, the exact failure mode ADR-0017 warned about. We move logic to services where there is logic; pure CRUD stays where it is.

**Put services inside `apps/platform/` and call them via HTTP loopback.** Rejected: cron jobs and CLI tools do not have an HTTP context. The BFF-via-loopback pattern (ADR-0010) is for RSC-to-API; it is not a substitute for in-process function calls from non-HTTP entry points.

## References

- `docs/design/workout-redesign.md` §10.1 (architecture in monorepo) and §12.5 (service-layer rationale).
- ADR-0017 — partially superseded.
- ADR-0027 — the redesign that triggers this layer.
- ADR-0023 — test strategy (services tested against real database).

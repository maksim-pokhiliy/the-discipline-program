# 0032. Single-team product simplification

> **[SUPERSEDED — partial]** by ADR-0037 on 2026-05-03 — clauses (3) "Library scopes are SYSTEM and COACH" and (5) "Plan ownership is via `creatorId` plus `PlanCoachAssignment`" were rolled back when the plan-editor / library / templates feature was removed; the `LibraryScope` enum and `PlanCoachAssignment` model no longer exist. Plan ownership reduces to `creatorId === userId` OR role IN (ADMIN, HEAD_COACH) — the assignments-based grant path is gone (see ADR-0037 D6). Clauses (1) "Role enum is the source of truth" with `{ ADMIN, HEAD_COACH, COACH, ATHLETE }`, (2) "no Team / Tenant entities", (4) "HEAD_COACH sees everything", and (6) "CoachAthleteAssignment remains explicit" all survive unchanged.

- **Status:** Accepted
- **Date:** 2026-04-26
- **Tags:** `domain`, `scope`, `lms`, `iam`

> Status flipped from Proposed to Accepted: single-team simplification has landed and is load-bearing in the schema and the role model.

## Context

The project carries a structural ambiguity that has shown up repeatedly in design conversations: is the Discipline Program a B2B SaaS that one day hosts many gyms, or is it a product built for one specific gym (one team, one head coach, one set of athletes)?

The answer from the product owner is the latter. The Discipline Program serves one gym. There is one head coach. The other coaches work for that head coach. The athletes belong to the gym, not to a tenant. There is no roadmap path that turns the system multi-tenant in the next 12 months, and very likely not in the next 24.

The schema, however, has been drifting B2B-shaped. `CoachProfile` exists as a separate entity from `User`, plans are owned by `coachId → CoachProfile`, athletes are linked to coaches via a `CoachAthleteAssignment` table, role-checking is split across `User.role` and `CoachProfile`/`AthleteProfile` predicates. Multi-tenancy artifacts (Team, TeamMembership, per-tenant scoping) have been considered for several pieces of work, including the library design.

The cost of that drift is concrete. The library scoping conversation in `docs/design/workout-redesign.md` was unable to settle on a clean SYSTEM-vs-COACH split until the multi-tenancy question was answered, because the latter introduced a third scope (TENANT). The HEAD_COACH role — the head coach is not just another COACH; they own the gym and need omniscient visibility into all plans, all athletes, all libraries — has no clean home in the multi-tenant version of the model. A multi-tenant retrofit later, if it ever happens, has a known shape (add a `tenantId` column and propagate it); a single-team forward path that pretends to be multi-tenant has no shape at all, just confusion.

## Decision

We codify the single-team model. Concretely:

1. **Role enum is the source of truth for permissions.** `Role` becomes `{ ADMIN, HEAD_COACH, COACH, ATHLETE }`. `HEAD_COACH` is added to the existing enum (was `{ ADMIN, COACH, ATHLETE }`). The new role propagates to `packages/contracts/src/entities/iam/auth/auth.constants.ts` (`UserRole` enum), to `packages/api-server/src/mappers/iam/enum-maps.ts` (`ROLE_MAP` and `ROLE_TO_PRISMA_MAP`), to `apps/admin` and `apps/platform` middleware/proxy guards, and to every endpoint that branches on role.
2. **No team or tenant entities.** No `Team`, no `TeamMembership`, no `TenantId`. The gym is implicit; rows do not need to identify which gym they belong to.
3. **Library scopes are SYSTEM and COACH.** SYSTEM rows have `ownerId IS NULL` and are visible to everyone. COACH rows have `ownerId = userId of the creating coach` and are visible to that coach (plus admin/head coach). There is no third scope.
4. **HEAD_COACH sees everything.** The head coach reads any plan, any library item, any athlete's progress. The check is `Role IN (ADMIN, HEAD_COACH)` — not "is this coach assigned to this athlete".
5. **Plan ownership is via `creatorId` plus assignments.** A `TrainingPlan` has one creator (audit field) and a many-to-many `PlanCoachAssignment` for editing rights. There is no team-level plan ownership.
6. **Coach-athlete relationships remain explicit but local.** `CoachAthleteAssignment` continues to exist (it is useful for "this coach owns this athlete's day-to-day programming"), but it is not the only path to access — head coach and admin bypass it.

The decision is bounded: it does not retire `CoachProfile` or `AthleteProfile` (they hold profile-specific fields and survive). It does not change billing tenancy (subscriptions are per-user, no tenant abstraction needed).

## Consequences

**Positive:**

- The library design (ADR-0034) has a clean two-scope model, no third scope to argue about.
- Permissions decisions have one input (`Role`), not three (Role + CoachAthleteAssignment + Team membership). Code paths shorten; bugs at the intersection disappear.
- HEAD_COACH has a real home. An admin tab "all plans" works. A head-coach dashboard "all athletes' progress" works. Neither needs a tenancy filter that does not exist.
- Onboarding to the codebase is simpler — one mental model, not two layered models.

**Negative:**

- If the product becomes multi-tenant later, every scoped query (currently row-scoped by ownership) needs to grow a `tenantId` filter. This is the standard B2B retrofit, well-understood, but it is a real cost. We accept it because the path back to single-team after building multi-tenant prematurely is much worse than the path forward.
- Ad-hoc "this user can see this row" predicates have to be rewritten to include the HEAD_COACH bypass. We catch this in M0.2 by auditing every `verify*Ownership` call.

**Neutral:**

- `CoachProfile.trainingPlans` relation is dropped because plans no longer live on `coachId → CoachProfile`. The relation moves to `TrainingPlan.creatorId → User` plus `PlanCoachAssignment[]`.
- The single-team simplification is a **product** decision, not a technology decision. If the product owner reverses course, this ADR is superseded by a new ADR that introduces tenancy with a clean migration plan.

## Alternatives considered

**Keep multi-tenant-ready model.** The status quo path. Rejected: the cost of carrying tenancy artifacts is paid every week (every new feature has to decide what to do with TenantId), and the benefit (a future B2B path) is not on any roadmap. The cost is real, the benefit is hypothetical.

**Build true B2B multi-tenancy now.** Rejected for the same reason in reverse — building tenancy infrastructure for a product that has no second tenant is large, expensive, and produces no value the product owner has asked for. If B2B happens, it gets its own design pass and its own ADR.

**Use Roles + a single Team-of-1 row everywhere.** Carry one `Team` row that everyone belongs to, just to keep the multi-tenant shape latent. Rejected: dishonest. Either the system is multi-tenant or it is not. A degenerate `teamId = "the-only-team"` everywhere is more confusing than no `teamId`, because every reader has to understand it is intentionally degenerate.

**Push HEAD_COACH out of the Role enum into a per-user flag (`User.isHeadCoach: Boolean`).** Considered briefly. Rejected: the role enum is already the dispatch point for permissions; introducing a parallel flag splits the dispatch and creates a class of bugs where role and flag disagree. HEAD_COACH is genuinely a role, and one head coach at a time is the rule (enforced via a unique partial index on `User.role = HEAD_COACH` if needed; out of scope for M0).

## References

- `docs/design/workout-redesign.md` §1 (single-team modelling), §3.1 (glossary), §4.4 (library scope and permissions).
- ADR-0034 — three CRUD libraries with SYSTEM/COACH scope (built on this decision).

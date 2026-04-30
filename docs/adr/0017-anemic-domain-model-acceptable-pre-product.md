# 17. Anemic domain model acceptable pre-product

- **Status:** Partially superseded by ADR-0028 (LMS context only; non-LMS endpoints still anemic)
- **Date:** 2026-04-12
- **Context:** Audit section 2 flagged that the project has a classic anemic domain: Zod schemas define data shapes, mappers convert between layers, and business logic lives directly in endpoint files. There is no service layer — `packages/api-server/src/services/` contained only `auth.ts` (now moved to `iam/auth-service.ts`).

## Decision

Accept the anemic model as the current architecture. Do not introduce a service layer preemptively.

Reasons:

1. **The project is pre-product.** Database is empty, no real users. The cost of restructuring later is low because there is no production data, no live traffic, and no external API consumers.
2. **Current complexity does not justify a service layer.** Most endpoints are straightforward CRUD with Prisma queries + mapper calls. The few complex operations (`computeProgressBuckets`, `reconcileActionItems`, `transitionPlanStatus`) are already extracted as named functions within their endpoint files.
3. **Premature service layers become pass-through layers.** Adding `UserService.createUser()` that just calls `prisma.user.create()` adds indirection without value.

### When to extract a service layer

Extract a service when any of these trigger:

- **An operation is called from 2+ endpoint files.** Shared logic must live in a shared place.
- **An endpoint file exceeds ~300 lines** (ESLint `max-lines`). This is a signal that business logic has grown beyond what fits in a handler.
- **A transaction spans multiple aggregates.** Transaction orchestration is a service concern, not an endpoint concern.
- **A scheduled job / queue consumer needs the same logic** as an HTTP handler. The logic must be callable without an HTTP context.

## Consequences

- Business logic stays in endpoint files until a trigger is hit.
- `packages/api-server/src/services/` is effectively empty and may be removed.
- This ADR should be superseded when the first service is extracted, documenting the trigger that motivated it.

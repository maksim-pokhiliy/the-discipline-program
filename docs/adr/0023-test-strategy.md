# 0023. Test strategy — current state and improvement plan

- **Status:** Accepted
- **Date:** 2026-04-13
- **Deciders:** Lead Architect
- **Tags:** `testing`, `quality`, `ci`

## Context

This ADR captures the test-strategy assessment of the project. At write time the project had 240 tests across 23 files in 2 packages (api-server: 201 tests in 21 files, contracts: 39 tests in 2 files). All other packages (apps, ui, query, shared, auth, api-client) had zero tests.

The test suite is reliable — all 240 tests pass consistently, with Neon cold-start as the only known flake (CI uses local postgres, eliminating this). Test run time is ~12 seconds.

## Decision

### Current test architecture (keep as-is)

**Suite-level isolation, not per-test.** Tests use `beforeAll`/`afterAll` with shared test data. This is intentional — transaction-per-test with real Postgres is 10x slower, and the current approach works reliably for 240 tests. The trade-off (shared state between tests within a suite) is acceptable at this scale.

**Raw PrismaClient in test helpers.** Cleanup uses `new PrismaClient()` directly, bypassing the soft-delete extension. This is correct — cleanup must hard-delete data, and the soft-delete extension would intercept deletions.

**Dynamic table cleanup with type cast.** `cleanup()` uses `(rawPrisma as unknown as Record<...>)` for universal table-based deletion. This is a pragmatic choice for test infrastructure — the alternative (explicitly listing every model) is more verbose and harder to maintain.

### Concrete fix (implemented in 9.2.A)

**cleanup() silent failure.** `.catch(() => {})` swallows cleanup errors, potentially leaving orphaned test data. Fixed to log errors via `logger.error` while still allowing the cleanup sequence to continue.

### Coverage gaps (documented, not fixed)

**Untested endpoints (~14):**

- CMS: contact admin/inbound, dashboard admin, pages admin/public/sections, product admin/public, review admin/public, blog public
- Coaching: athletes list, athletes detail

**Untested mappers (~12):**

- CMS: blog, contact, product, review
- Coaching: coach-action-item, coach-note
- LMS: plan-enrollment

**Untested contract schemas (~110 of ~115 files):**

- Only 2 test files exist (pages-api.schema, coach-action-item.schema)
- All other schema files have no validation tests

### Deferred improvements with triggers

| Improvement                               | Trigger                                               | Approach                                               |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| E2E tests (Playwright)                    | First critical user flow (signup → purchase → access) | Start with 3-5 smoke tests for golden paths            |
| Frontend component tests                  | Platform app active development (Phase 3)             | testing-library + happy-dom for @repo/ui components    |
| Property-based tests (fast-check)         | Money math change or date math refactor               | Focus on money VO, date-helpers, Zod schema edge cases |
| Mutation testing (Stryker)                | Test count exceeds 500                                | Verify test quality, not just coverage                 |
| Contract tests (api-client ↔ api-server) | First client/server schema drift incident             | Shared Zod schema validation in test suite             |
| Visual regression                         | Design system stabilization                           | Chromatic or similar for @repo/ui Storybook            |
| Endpoint test coverage push               | Pre-launch quality gate                               | Start with CMS (most user-facing), then coaching       |
| Mapper test coverage push                 | Mapper logic change or bug found via mapper           | Pure function tests, easy to write in bulk             |

## Consequences

- **Positive:** Test infrastructure issues documented and triaged. Silent cleanup failure fixed. Clear triggers prevent premature test investment.
- **Negative:** ~14 endpoints and ~12 mappers remain untested. Coverage gaps are known risks accepted at pre-launch stage.
- **Neutral:** Test ergonomics improved in §8 (turbo filtering). Future test additions follow the existing patterns in `test/helpers.ts`.

## References

- `packages/api-server/src/test/helpers.ts`: test helper infrastructure
- `packages/api-server/src/test/setup.ts`: vitest setup (Prisma disconnect)
- ADR 0019: database strategy (raw PrismaClient justification for test cleanup)
- `.github/workflows/ci.yml`: CI uses postgres:16-alpine service container

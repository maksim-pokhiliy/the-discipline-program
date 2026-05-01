# 0025. Code quality decisions deferred to active development phase

- **Status:** Accepted
- **Date:** 2026-04-14
- **Deciders:** Maksim Pokhiliy
- **Tags:** `typescript`, `eslint`, `code-quality`

## Context

A code quality audit assessed type system strictness, ESLint configuration, and advanced TypeScript patterns. The actionable items were implemented: `interface → type` fixes (2 violations), CLAUDE.md accuracy fix, tsconfig strict flags (`noFallthroughCasesInSwitch`, `noImplicitReturns`), and `eslint-plugin-only-warn` removal. What remains are design patterns and tooling that require either active development to justify or calibration effort disproportionate to pre-production value.

## Decision

The following code quality improvements are deferred. Each has a **trigger**.

**Branded types.** `type UserId = string & { __brand: 'UserId' }` would prevent mixing `CoachId`, `AthleteId`, and arbitrary strings. `AuthenticatedHandler` accepts `userId: string` — any string. `RouteContext.params` is `Promise<Record<string, string>>` — no per-route typing. No misuse incidents have occurred. **Trigger:** first bug caused by passing wrong ID type to a function, or first multi-tenant feature where ID confusion has security implications.

**Discriminated unions.** `type Result<T> = { kind: 'success'; data: T } | { kind: 'error'; error: E }` with exhaustiveness checking. No if-chains in the codebase currently benefit from this pattern. **Trigger:** first complex state machine (e.g., subscription lifecycle, workout completion flow) where exhaustive case handling prevents bugs.

**Immutability by default.** `readonly` on props, `ReadonlyArray<T>`, `as const satisfies`. No mutation bugs reported. Adding `readonly` retroactively across all types is high-churn, low-value before production. **Trigger:** first bug caused by accidental mutation of shared state, or adoption of a state management library that benefits from immutable types.

**Cognitive complexity (eslint-plugin-sonarjs).** Not installed. 6 files exceed 300 total lines (pass ESLint due to `skipBlankLines`). The plugin would flag deeply nested functions. **Trigger:** first code review where nested complexity causes a bug or significantly slows understanding. Install with conservative thresholds (complexity: 15, cognitive-complexity: 15).

**Dead code detection (knip).** Not installed. No known dead exports after §1.2 reorganization. **Trigger:** codebase exceeds 1000 source files, or first incident where dead code caused confusion during development.

**Additional tsconfig strict flags.** `exactOptionalPropertyTypes` (investigated: 12 violations, requires `| undefined` on every optional property — ceremony > value) and `noPropertyAccessFromIndexSignature` (investigated: 5 violations in `@repo/env` process.env access — forces bracket notation on index signatures). Both deferred as ceremony-heavy with `noUncheckedIndexedAccess: true` already providing the main safety benefit. **Trigger:** revisit when TypeScript ecosystem tooling improves support for these flags, or when a bug is traced to the specific pattern these flags catch.

**Domain-specific error codes.** `ERROR_CODES` has 10 generic HTTP codes. Domain codes (SUBSCRIPTION_PAST_DUE, PAYMENT_FAILED, etc.) are premature — billing is not implemented. **Trigger:** first billing or domain-specific error flow where the client needs to distinguish error subtypes beyond HTTP status.

## Consequences

- **Positive:** no speculative patterns. The implemented items (interface→type, tsconfig flags, only-warn removal) deliver immediate value with zero ongoing cost.
- **Negative:** type system is permissive for ID types and optional properties. No automated dead code or complexity detection.
- **Neutral:** triggers are concrete and testable. Each deferred item can be adopted independently when its trigger fires.

## References

- ADR 0022 (monorepo discipline — `eslint-plugin-only-warn` first flagged there)
- `packages/typescript-config/base.json` — current strict flags

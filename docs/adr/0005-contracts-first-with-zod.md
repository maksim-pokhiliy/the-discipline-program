# 0005. Contracts-first API with Zod

- **Status:** Accepted
- **Date:** 2026-04-10
- **Tags:** `api`, `validation`, `type-safety`, `contracts`

## Context

The monorepo has an API boundary between the Next.js route handlers (which run on the server) and the React client components (which run in the browser). Both sides must agree on the shape of every request and response. Without a formal contract, three failure modes emerge:

1. **Client-server drift.** A handler adds a field, the client does not know about it. A client sends a field, the handler ignores it. Nothing fails loudly.
2. **Runtime trust in untyped data.** `request.json()` returns `unknown` in TypeScript. A careless `as MyType` cast bypasses all validation and leaves the runtime exposed to malformed payloads.
3. **Mapper drift from the physical schema.** Prisma entities change. Domain types should change with them. Without an explicit contract layer, the mapping drifts silently.

The constraint on the contract layer:

- **No Prisma types cross the boundary.** `@repo/contracts` must not depend on `@prisma/client`. This keeps the package consumable by browser code.
- **Runtime validation is mandatory at the boundary.** Every request body, every URL params object, every response must be parsed through a schema at the point it crosses from the untyped world into the typed one.
- **Types must be derived from schemas, not declared separately.** A hand-written `type` that drifts from its schema is a latent bug.
- **Client and server share the same contract package.** No duplication, no parallel hierarchies.

## Decision

We use **Zod 3** as the single contract layer. All request/response/params/query schemas live in `packages/contracts/src/entities/<entity>/`, organized per entity:

```
<entity>/
  <entity>.schema.ts          ← domain data schemas
  <entity>.types.ts           ← types inferred via z.infer
  <entity>.constants.ts       ← enums, length limits, business constants
  <entity>-api.schema.ts      ← request/response/params schemas for HTTP API
  <entity>-api.types.ts       ← inferred API types
  index.ts                    ← barrel export
```

Types are **never declared manually**. They are always `z.infer<typeof someSchema>`. If a reader needs a type, they import it from `<entity>.types.ts`; if they need runtime validation, they import the schema from `<entity>.schema.ts`. Same name, different file.

Validation happens at the API boundary through the route handler factories in `@repo/api-routes`:

```ts
export const POST = withAdminAuth(
  createPostHandler(
    cmsBlogAdminApi.createPost,
    createBlogPostRequestSchema,
    blogPostResponseSchema,
  ),
);
```

Every factory takes a `requestSchema` (mandatory for write handlers) and an optional `responseSchema`. The request body is parsed with `requestSchema.parse()` before the endpoint function sees it; the response is parsed with `responseSchema.parse()` before it is serialized to JSON.

The `@repo/contracts` package has exactly one runtime dependency: `zod`.

## Consequences

**Positive:**

- End-to-end type safety. A schema change in `training-plan.schema.ts` ripples to every consumer through `z.infer`. `pnpm check-types` catches drift at build time.
- Zero Prisma leakage. A UI component can safely import `@repo/contracts/training-plan` without pulling `@prisma/client` into the browser bundle.
- Request validation is enforced by the handler factories, not left to the discretion of each endpoint author. Bypass requires writing a raw `NextResponse.json` handler, which is visible in code review.
- Same schemas validate both directions: a client can parse a response with the same Zod schema the server used to produce it (when we wire client-side response validation — currently a gap, see audit section 6).
- Error messages from `ZodError` are structured: `{ path, message }`. They are mapped to `ValidationError` in `handleApiError`.

**Negative:**

- **`responseSchema` is optional** in every factory (`createGetHandler`, `createPostHandler`, etc.). A handler author can forget to validate the response. Tracked in the audit, section 6 — the response schema should be mandatory or at least lint-checked.
- **`api-client` does not import `@repo/contracts`.** The client-side HTTP layer is typed through generics (`request<T>`) but does not actually validate responses at runtime. A server-side schema drift reaches the UI as a runtime crash, not a validation error. Tracked in the audit, sections 1.6 and 9.
- **Zod schemas are inconsistent about constants vs magic numbers.** Some schemas import from `<entity>.constants.ts`; others hard-code `.max(200)`. Tracked in the audit, section 6.
- **`z.date()` vs `z.coerce.date()`** is not consistently applied. `z.date()` works for server-internal validation (where data is already a `Date` instance) but fails on JSON-parsed input where dates are strings. 51 `z.date()` usages across 20 files; 9 `z.coerce.date()` across 5. Tracked in the audit, section 6.
- **Hardcoded English error messages in schemas** (`"Password must be at least 6 characters"`, `"Author name is required"`). Contract-level i18n is fragmented. Tracked in the audit, section 7.
- Zod adds a runtime cost on every parse. At our workload this is negligible, but it is not free.

**Neutral:**

- `packages/contracts/src/common.ts` is almost empty (two schemas: `idParamSchema`, `planIdParamSchema`). Domain primitives — `Money`, `Email`, `Cuid`, `Slug`, `Pagination<T>`, `ListRequest<T>` — should live here but do not. Rebuilding `common.ts` is part of pending work (audit sections 2 and 6).
- Zod 3 is the current stable line. Zod 4 exists in alpha; not adopted yet. Worth revisiting when Zod 4 stabilizes and the ecosystem (OpenAPI generators, tRPC adapters) catches up.

## Alternatives considered

**Valibot.** Lighter than Zod, smaller bundle, similar API. Rejected because Zod has deeper ecosystem integration (`@hookform/resolvers/zod` is the canonical form integration; Zod has first-class support in tRPC, React Query, etc.) and because the bundle size difference does not matter at the server boundary.

**io-ts.** More functional, more category-theory flavored. Excellent type safety. Rejected because the DSL is heavier for teams that are not already writing fp-ts, and the error messages are worse out of the box.

**Yup.** Weaker TypeScript inference. Good enough for forms, not good enough for API contracts. Rejected.

**TypeBox + JSON Schema.** Very compelling if we needed OpenAPI generation or cross-language contracts. We do not — the only consumer of the API is the same monorepo's TypeScript code. Revisit if we ever expose a public API to mobile native clients.

**tRPC.** Eliminates the HTTP layer entirely — the client calls the server as if it were a typed function. Considered seriously. Rejected because (a) we wanted the API to be a real HTTP API that a future mobile app or external integration could consume, and (b) tRPC pushes back against the kind of BFF aggregation (`getPageData`) that our CMS needs. tRPC would be a fine choice for a pure SPA backend; it is the wrong fit for a monorepo that also ships a public marketing site and is planning a billing webhook surface.

**Hand-written TypeScript types + manual validation.** Maximum control, maximum drift. Rejected as obsolete in 2026.

**OpenAPI-first with code generation.** Strong for organizations with multiple consumers of the API. At our scale, the codegen step is friction without benefit. Worth revisiting if the API gains external consumers.

## References

- `packages/contracts/` — the contract package.
- `packages/api-routes/src/route-helpers.ts` — request/response validation wiring.
- `packages/contracts/src/entities/training-plan/` — canonical entity layout.
- ADR 0003 — Prisma as the source of physical truth; contracts as the source of API truth.
- Big Tech audit, sections 6 (API design), 2 (value objects), 7 (i18n) — known gaps.

# 0020. API design — versioning, body limits, and deferred decisions

- **Status:** Accepted
- **Date:** 2026-04-13
- **Deciders:** Lead Architect
- **Tags:** `api`, `versioning`, `security`, `caching`

## Context

An API design audit surfaced ~35 findings. Several require architectural decisions that affect the entire API surface. This ADR captures the strategy for API versioning, body size limits, and defers items with explicit triggers.

The project has three API namespaces: `/api/admin/*` (auth-protected), `/api/platform/*` (auth-protected), `/api/public/*` (open). No external consumers exist yet — all API calls are server-to-server (Next.js server components → route handlers) or browser-to-same-origin.

## Decisions

### 1. API versioning: URL-prefix strategy, implemented on first external consumer

When the first external consumer appears (mobile app, partner integration), version the API via URL prefix: `/api/v1/admin/*`. The current unversioned paths (`/api/admin/*`) become the implicit v1.

**Why URL prefix over headers:** URL prefix is visible in logs, debuggable with curl, cacheable by CDN. Header-based versioning (`Api-Version`) is invisible in access logs and requires custom middleware. For a product API (not a platform API with thousands of consumers), URL prefix is the standard choice.

**Why not now:** Adding `/v1/` to every route today is churn with no benefit — there are no external consumers to protect from breaking changes. Internal consumers (our own apps) deploy atomically with the API.

**Trigger:** First external consumer or first public API documentation effort.

### 2. Body size limit: Vercel platform limit is the primary control

Vercel enforces a 4.5MB request body limit at the platform level. This applies to all route handlers regardless of application code. For JSON API endpoints, 4.5MB is generous — a typical request is under 10KB.

Application-level body size validation (e.g., checking `Content-Length` before parsing) adds defense-in-depth but has limited value without rate limiting: an attacker can still send many 4.5MB requests. The two controls are complementary — rate limiting bounds request count, body limits bound request size.

**Current state:** Platform-level 4.5MB limit is active. No application-level limit.
**Trigger:** Implement application-level body size limits alongside rate limiting (ADR 0018 trigger: first production deployment with real traffic).

### 3. Cache-Control headers on public marketing endpoints

Public marketing endpoints (`/api/public/*`) serve content that changes infrequently (products, reviews, blog posts, page sections). These should return `Cache-Control` headers to enable CDN and browser caching.

Strategy:

- Static content (pages, sections): `Cache-Control: public, s-maxage=300, stale-while-revalidate=60`
- Dynamic lists (products, reviews): `Cache-Control: public, s-maxage=60, stale-while-revalidate=30`
- Single articles (blog): `Cache-Control: public, s-maxage=300, stale-while-revalidate=60`

Admin and platform endpoints must NOT have public caching — they are user-specific and auth-protected.

### 4. Response schema validation is mandatory

The `responseSchema` parameter in route handler factories must be required, not optional. Every API response must be validated against its Zod schema before leaving the server. This catches mapper bugs and schema drift at the boundary.

Implemented in bullet 6.2.A.

### 5. Consistent HTTP status codes for mutations

- `POST` (create) → `201 Created`
- `PUT`/`PATCH` (update) → `200 OK`
- `DELETE` and void operations → `204 No Content`

Currently inconsistent: auth POST factories return 201, public POST returns 200. Delete handlers return `{ success: true }` with 200.

Implemented in bullet 6.2.B.

## Consequences

- **Positive:** Clear API contract for status codes, validation, and caching. Versioning strategy decided before it's needed.
- **Negative:** Making responseSchema required will surface existing gaps — every route handler without a schema needs one added. Short-term churn, long-term correctness.
- **Neutral:** Cache-Control headers require monitoring cache hit rates after deployment. Stale content is possible within the TTL windows.

## Alternatives considered

- **Header-based versioning (`Api-Version`):** More elegant for platform APIs with many consumers. Rejected because URL prefix is simpler, more visible, and sufficient for a product API.
- **Application-level body size via middleware:** Could reject before JSON parsing. Rejected for now because Vercel's platform limit is already effective, and without rate limiting the protection is incomplete.
- **Optional responseSchema with lint rule:** Keep optional but enforce via ESLint custom rule. Rejected because type-level enforcement is stronger than lint — you can't forget what the compiler rejects.

## References

- ADR 0018: Security deferred decisions (rate limiting trigger)
- ADR 0019: Database strategy (pagination deferred to §10)
- Vercel docs: [Request body size limits](https://vercel.com/docs/functions/runtimes#request-body-size)

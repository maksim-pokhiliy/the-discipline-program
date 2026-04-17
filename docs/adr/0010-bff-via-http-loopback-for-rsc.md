# 0010. BFF via HTTP loopback for server components

- **Status:** Accepted (under review — see Consequences and audit 1.1)
- **Date:** 2026-04-10
- **Tags:** `architecture`, `nextjs`, `rsc`, `bff`, `under-review`

## Context

Next.js App Router supports server components that fetch data on the server during SSR. The standard pattern is:

```tsx
// Server component
const initialData = await apiFn(...);
return <ClientComponent initialData={initialData} />;
```

The question is: **what does `apiFn` do?** Two options:

1. **Direct call into the domain layer.** `apiFn` is a TypeScript function imported from `@repo/api-server`. It runs in the same Node.js process as the server component, touches Prisma directly, and returns a domain object. Zero network, zero JSON, zero serialization round-trip.
2. **HTTP loopback.** `apiFn` is an HTTP client that calls `http://localhost:3000/api/...` or `${NEXT_PUBLIC_APP_URL}/api/...`. The server component makes an HTTP request to its own route handler, which in turn calls the domain layer. One network hop (loopback to the same process), one JSON serialization and deserialization.

The advantages of option 1 are obvious: zero overhead, no double work. The advantages of option 2 are more subtle:

- **Single code path for server and client.** The browser calls `/api/blog/[id]` via `fetch`. The server component calls `/api/blog/[id]` via `fetch` too. Exactly the same URL, exactly the same validation, exactly the same middleware. No "did we remember to run auth on the direct-call path?" question.
- **Route handlers are the contract surface.** If an endpoint has auth, rate limiting, request validation, or response validation wired at the route level, a direct-call bypass skips all of it. Loopback goes through the same pipeline the browser does.
- **Session propagation is automatic.** Cookies are passed through, NextAuth picks up the session the same way. A direct call would need manual session threading.
- **Mental model consistency.** Junior engineers do not need to learn two data-fetching patterns. "Server component? Use `serverApi.*`. Client component? Use `browserApi.*` through React Query. Both of them call the same HTTP endpoints."

The disadvantages of loopback are also real:

- Double serialization (domain object → JSON → parsed JSON).
- Extra latency (even loopback is not free on serverless).
- Less efficient under high load.
- The `NEXT_PUBLIC_APP_URL` env var becomes load-bearing: if it is wrong, SSR breaks.

## Decision

We use **HTTP loopback** for server-side data fetching. The implementation lives in `packages/api-client/src/server.ts`:

```ts
export const createNextServerClient = () =>
  new ApiClient({
    baseUrl: baseEnv.NEXT_PUBLIC_APP_URL,
    getHeaders: async () => {
      const cookieStore = await cookies();
      return { Cookie: cookieStore.toString() };
    },
    onUnauthorized: () => redirect(AUTH_ROUTES.LOGOUT),
  });
```

Each app instantiates a `serverApi` object in its `src/lib/api/server.ts` file. Server components import it:

```tsx
// apps/marketing/src/app/page.tsx
const HomePage = async () => {
  const initialData = await serverApi.pages.getHome();
  return <HomePageClient initialData={initialData} />;
};
```

`serverApi` under the hood calls `fetch(NEXT_PUBLIC_APP_URL + "/api/...", { headers: { Cookie } })`. The route handler receives the request, runs auth wrappers, validates the body, calls the domain layer, and returns JSON. The JSON is parsed back into a typed object for the server component.

## Consequences

**Positive:**

- Single code path for server and client. Every data fetch goes through the same route handler, the same validation, the same auth.
- Session propagation is automatic via cookies. No threading session IDs through server component props.
- Debugging is easier: an issue with a server component fetch shows up in the same HTTP request logs as a browser fetch. One place to look.
- Auth wrappers in `@repo/api-routes` (`withAdminAuth`, `withPlatformAuth`) run on the loopback path. Adding a security check at the route level covers both the browser and server component call paths.
- The `@repo/api-client` is genuinely shared between browser and server. Small package, one implementation.

**Negative:**

- **Double serialization.** Domain object → JSON (in the route handler) → parsed JSON (in the server component). Every server component fetch pays this cost. For small payloads, negligible. For dashboard aggregates with many nested objects, measurable.
- **Extra latency on every server component render.** Even loopback `fetch` is not free. On Vercel serverless, cold starts exacerbate this: the server component waits for its own function to respond.
- **`cache: "no-store"` is hard-coded in `ApiClient`.** Server components cannot opt into HTTP caching for idempotent reads. Every SSR render hits the database. Marketing pages with `export const dynamic = "force-dynamic"` compound this — there is no CDN cache in front of the route handler either.
- **`NEXT_PUBLIC_APP_URL` is load-bearing.** If misconfigured in production, SSR breaks. If set to the wrong host, SSR makes requests to the wrong environment. One env var that absolutely must be correct.
- **Audit status.** The Big Tech audit section 1.1 has this decision flagged for review: it may be the right call for consistency, but the performance cost is significant enough that it deserves a dedicated re-evaluation once real traffic arrives. This ADR captures the current state; a future ADR may supersede it.

**Neutral:**

- The loopback pattern looks exactly like the browser pattern to developers writing new endpoints. That is the point. The trade-off is that developers who want the "direct call" escape hatch for performance reasons do not have one — they have to either accept the cost or write a new ADR.
- Because every endpoint is called the same way, there is no direct-call path that can bypass auth by accident. Considered a security benefit, not just consistency.

## Re-evaluation trigger

The "under review" status is resolved when any of the following concrete conditions is met; at that point, open a follow-up ADR that either confirms this decision with new data or supersedes it:

- Marketing `revalidate = 300` loopback p95 response time exceeds **100 ms** in Vercel Analytics for two consecutive weeks.
- A second app (admin or platform) adopts the loopback pattern — shared loopback infra (caching, error semantics, session propagation) deserves its own design pass before duplication.
- Next.js 17 lands with first-class RSC loopback or server-action read semantics that subsume this pattern.

Until one of these triggers fires, this ADR remains the canonical answer and direct-domain-call escape hatches are not permitted.

## Alternatives considered

**Direct domain calls from server components.** `import { cmsPagesPublicApi } from "@repo/api-server"` in a server component file, call `cmsPagesPublicApi.getHomePage()` directly. Faster (no HTTP hop, no serialization). Two problems. First, session propagation: the server component would need to reach into `next-auth/next` to read the session cookie, construct a fake "user context" object, and pass it down to the domain function. That is the same machinery the route handler does, but now it lives in two places. Second, the route handler and the server component become independent call sites for the same domain function, which means their validation and auth drift over time. Rejected at this stage on consistency grounds; revisit if SSR latency becomes a user-visible problem.

**Next.js server actions for writes, loopback for reads.** A hybrid. Server actions bypass the HTTP layer for mutations. Would give us the performance of direct calls for writes and the consistency of loopback for reads. Rejected because server actions have their own invocation and error model — they would require writing a second set of handler factories. The mental-model consistency we gained from loopback gets partially undone. Worth reconsidering in a future ADR if server actions mature.

**tRPC with the "links" pattern.** tRPC's `httpLink` and `directLink` let you call the same procedures over HTTP in the browser and directly in server components. This is exactly the pattern we want — same function, two transports. Rejected because we already committed to REST + Zod + route handler factories (ADR 0005). Introducing tRPC now would mean maintaining two API styles.

**GraphQL with a server-side executor.** A GraphQL server can be called over HTTP from the browser and over a direct executor (`graphql()` function) from the server. Gets the same "one schema, two transports" win. Rejected for the same reason as tRPC — the project is not built on GraphQL, and introducing it is a major architectural shift.

**SSR without data fetching; hydrate on the client only.** Render skeleton HTML on the server, let React Query fetch on the client. Simpler, no loopback. Rejected because it breaks SEO (search engines see empty HTML) and breaks initial content delivery (user sees a loading state instead of content). Ironically this is exactly what the current marketing pages effectively do today: they `force-dynamic` + use client components with `initialData`, but the initial data still comes from the loopback path. The audit flags this as a separate problem (marketing should be static).

## References

- `packages/api-client/src/server.ts` — `createNextServerClient` implementation.
- `packages/api-client/src/client.ts` — the shared `ApiClient` class.
- `apps/marketing/src/app/page.tsx` — a canonical server component that uses loopback.
- ADR 0004 — NextAuth and the cookie-based session that loopback propagates.
- ADR 0005 — contracts-first, which the route handlers validate.
- Big Tech audit, section 1.1 — this decision is flagged for review.

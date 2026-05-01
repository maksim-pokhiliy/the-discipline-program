# Vercel config duplication

`apps/admin/vercel.json`, `apps/marketing/vercel.json`, `apps/platform/vercel.json` are identical (post-SEC-001 -- CSP moved to per-request middleware emitting nonces). All three set the same five security headers (`Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `X-XSS-Protection`, `Permissions-Policy`).

## Why three copies, not one shared file?

Vercel processes one `vercel.json` per project. There is no `extends` mechanism, no environment-variable interpolation that reaches into JSON, and no monorepo-level config inheritance.

Choice considered:

1. **Accept the duplication** -- chosen. Three files, ~30 lines each, kept in sync by code review. Drift risk is real but bounded (any change has to touch three files; a stale file shows up immediately as different headers in production).
2. **Generator script** -- rejected. Adds build-time complexity, requires the build to run before Vercel reads `vercel.json`, and Vercel reads `vercel.json` from the committed tree, not from build output. Net: more friction than three duplicate files.

## When changing security headers

Update all three files together. Verify with:

```bash
diff apps/admin/vercel.json apps/marketing/vercel.json
diff apps/admin/vercel.json apps/platform/vercel.json
```

(Both diffs should output nothing.)

## CSP

Lives in middleware (`apps/*/src/proxy.ts` -> `packages/api-routes/src/csp.ts`), not in `vercel.json`. The middleware emits a fresh nonce per request so `script-src 'self' 'nonce-<n>' 'strict-dynamic'` works without `'unsafe-inline'`. Keep CSP out of `vercel.json` -- mixing the two delivery paths leads to header collision and spec-violating duplication.

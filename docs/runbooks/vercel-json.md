# Vercel config duplication

`apps/admin/vercel.json`, `apps/marketing/vercel.json` and `apps/platform/vercel.json` share one
block and diverge in exactly two documented places.

**Shared, and identical byte for byte in all three:** the five security headers
(`Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `X-XSS-Protection`,
`Permissions-Policy`) on `/(.*)`, and `"regions": ["fra1"]`. This is the part that must never drift
(post-SEC-001 -- CSP moved to per-request middleware emitting nonces).

**Per-app, and deliberately not shared:**

| App       | Extra key   | What it is                                                           |
| --------- | ----------- | -------------------------------------------------------------------- |
| admin     | `crons`     | the nightly retention sweep, `/api/cron/retention` at `0 3 * * *`    |
| platform  | `redirects` | the apex rule: everything except `/api/v1` goes to `www` (see below) |
| marketing | --          | the shared block only                                                |

## Why three copies, not one shared file?

Vercel processes one `vercel.json` per project. There is no `extends` mechanism, no environment-
variable interpolation that reaches into JSON, and no monorepo-level config inheritance.

Choice considered:

1. **Accept the duplication** -- chosen. Three files, ~30 lines each, kept in sync by code review.
   Drift risk is real but bounded (any change has to touch three files; a stale file shows up
   immediately as different headers in production).
2. **Generator script** -- rejected. Adds build-time complexity, requires the build to run before
   Vercel reads `vercel.json`, and Vercel reads `vercel.json` from the committed tree, not from
   build output. Net: more friction than three duplicate files.

## When changing security headers

Update all three files together, then verify the shared block still matches by diffing the three
files with the per-app keys removed:

```bash
for pair in "admin marketing" "admin platform" "marketing platform"; do
  set -- $pair
  diff <(jq 'del(.crons, .redirects)' apps/$1/vercel.json) \
       <(jq 'del(.crons, .redirects)' apps/$2/vercel.json)
done
```

All three diffs should output nothing. The recipe assumes `jq`; without it,

```bash
node -e 'const s=p=>{const c=require(`./apps/${p}/vercel.json`);delete c.crons;delete c.redirects;return JSON.stringify(c)};const a=s("admin"),m=s("marketing"),p=s("platform");console.log(a===m&&m===p?"in sync":"DRIFTED")'
```

A plain `diff` of two whole files is **not** the check any more: admin carries `crons` and platform
carries `redirects`, so a whole-file diff is expected to be non-empty and tells you nothing.

The five headers are additionally asserted for the platform app by
`apps/platform/src/__tests__/vercel-config.test.ts`, which runs in CI.

## The platform apex redirect

`apps/platform/vercel.json` carries one redirect rule, dormant until `thedisciplineprogram.com` is
added as a custom domain of the platform Vercel project (the cutover, `apex-cutover.md`):

```json
{
  "destination": "https://www.thedisciplineprogram.com/:path*",
  "has": [{ "type": "host", "value": "thedisciplineprogram.com" }],
  "permanent": true,
  "source": "/:path((?!api/v1(?:/|$)).*)"
}
```

The apex has to live on the platform project because the legacy iOS app calls
`https://thedisciplineprogram.com/api/v1/*` and the Vercel edge refuses a request whose `Host`
disagrees with its SNI. Everything else on the apex belongs to the marketing site, so it is sent to
`www` with a 308.

Things that are true about this rule and worth not rediscovering:

- The `has` value is matched **anchored** (`^value$`) against the lowercased host with the port
  stripped, so `platform.thedisciplineprogram.com` and `www.thedisciplineprogram.com` do **not**
  match. Without that anchoring the rule would redirect the product's own domain to the marketing
  site. Keep the value a bare hostname -- no scheme, no port, no trailing slash -- and do not escape
  the dots: the documented form is a plain hostname, and an escaped value would silently match
  nothing if the edge ever treats it as a literal.
- The source pattern matches the root (`/` captures an empty parameter, and the destination renders
  it back as `/`), so no separate rule for `/` is needed.
- `/api/v1`, `/api/v1/` and anything below stay on the platform. `/api/v1x` and `/api/v2/...` do
  not -- the lookahead requires a `/` or the end of the path after the prefix.
- The querystring is not part of the matched path and is carried through to the destination.
- `/.well-known` is reserved by Vercel and cannot be redirected, so certificate issuance at the
  cutover is unaffected by the catch-all.
- Do **not** configure a domain-level redirect on the apex in the Vercel dashboard instead. That
  redirects every path, including `/api/v1`, which is the one thing the apex exists to serve.

The path semantics above are asserted by the config test; the live behaviour on the real edge is a
checklist item in `apex-cutover.md`, verified with `curl -k --resolve` before DNS moves.

## CSP

Lives in middleware (`apps/*/src/proxy.ts` -> `packages/api-routes/src/csp.ts`), not in
`vercel.json`. The middleware emits a fresh nonce per request so
`script-src 'self' 'nonce-<n>' 'strict-dynamic'` works without `'unsafe-inline'`. Keep CSP out of
`vercel.json` -- mixing the two delivery paths leads to header collision and spec-violating
duplication.

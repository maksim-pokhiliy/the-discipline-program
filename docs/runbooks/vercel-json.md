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

`apps/platform/src/__tests__/vercel-config.test.ts` asserts the same invariant in CI, and asserts
more than the recipe does: it reads all three files, compares the shared block after removing the
per-app keys, and checks every header's **value**, not just its name -- an `HSTS max-age=0`
downgrade fails the suite. The recipe above stays for reading a drift by hand.

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

- **The `has` value is a regular expression, and it is written escaped and anchored on purpose.**
  Next's own `matchHas` wraps it as `^value$`, but this file is executed by the Vercel edge, whose
  documentation describes `has.value` as a regex without promising anchoring, and whose CLI wraps
  equality conditions as `^…$` itself rather than relying on the matcher. An unanchored
  `thedisciplineprogram.com` would therefore be a substring match under one reading and an exact one
  under the other -- and a substring match would catch `platform.thedisciplineprogram.com`, sending
  the entire product to the marketing site while `/api/v1` kept working.
  `^thedisciplineprogram\.com$` is correct under **both** readings: it matches the apex, with or
  without a port (the host is lowercased and the port stripped before matching), and matches neither
  `platform.` nor `www.` nor `evil-thedisciplineprogram.com`. This cannot be verified offline --
  `vercel dev` does not evaluate `has` at all -- so the deploy that first ships this rule is followed
  by the live check below.
- The source pattern matches the root (`/` captures an empty parameter, and the destination renders
  it back as `/`), so no separate rule for `/` is needed.
- `/api/v1`, `/api/v1/` and anything below stay on the platform. `/api/v1x` and `/api/v2/...` do
  not -- the lookahead requires a `/` or the end of the path after the prefix.
- The querystring is not part of the matched path and is carried through to the destination.
- `/.well-known` is reserved by Vercel and cannot be redirected, so certificate issuance at the
  cutover is unaffected by the catch-all.
- Do **not** configure a domain-level redirect on the apex in the Vercel dashboard instead. That
  redirects every path, including `/api/v1`, which is the one thing the apex exists to serve.

- **A 308 from the apex carries none of the five security headers.** The redirect route is terminal
  and is evaluated before the headers route, so the response that leaves the edge is a bare redirect.
  This is accepted: nothing but the redirect lives on the apex for a browser, the destination on
  `www` serves its own headers, and `/api/v1`, which is not redirected, keeps them.

The path semantics and the anchoring above are asserted by the config test, which also compares all
three files. The live behaviour on the real edge is not offline-checkable, so it is checked twice:

**Immediately after the deploy that first ships this rule** -- before the apex exists as a domain,
while `platform.` is live and would be the casualty of an unanchored match:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://platform.thedisciplineprogram.com/
curl -sS -o /dev/null -w '%{http_code}\n' https://platform.thedisciplineprogram.com/api/v1/trainingLevel/all
```

Both must be `200`. A `308` on either means the host condition is matching as a substring; revert the
deploy.

**Before DNS moves at the cutover**, with `curl -k --resolve` against the Vercel address --
a checklist item in `apex-cutover.md`.

## CSP

Lives in middleware (`apps/*/src/proxy.ts` -> `packages/api-routes/src/csp.ts`), not in
`vercel.json`. The middleware emits a fresh nonce per request so
`script-src 'self' 'nonce-<n>' 'strict-dynamic'` works without `'unsafe-inline'`. Keep CSP out of
`vercel.json` -- mixing the two delivery paths leads to header collision and spec-violating
duplication.

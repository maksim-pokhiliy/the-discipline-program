# Runbook — apex cutover

Moving `thedisciplineprogram.com` off the legacy VPS and onto Vercel, so that the iOS app in every
athlete's pocket starts talking to the shim instead of the Spring backend. This is the flip the whole
apex-sunset initiative exists for.

**Status: skeleton.** Everything below marked _(dashboard)_ is a step the owner performs in the
Vercel or Cloudflare UI and confirms on the day; the shape is written from what has been verified,
not from what the dashboard is assumed to look like.

## What is already true before the day

- The apex must become a **custom domain of the platform Vercel project**. A bare DNS flip cannot
  work: the Vercel edge refuses a request whose `Host` disagrees with its SNI with a 403, which is
  how the rehearsal stand proved this in the first place.
- `apps/platform/vercel.json` already carries the redirect that sends every non-`/api/v1` path on the
  apex to `www` (`vercel-json.md`). It is dormant until the domain is added, and it is deployed.
- Today the VPS answers the bare apex with an empty 200. There is nothing on it to preserve.
- The App Store listing is delisted: installed copies keep working, and there are no new installs.

## The sequence

### 1. Immediately after the deploy that ships the redirect

Before the apex is a domain at all, and while `platform.` is live, prove the host condition is not
matching as a substring:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://platform.thedisciplineprogram.com/
curl -sS -o /dev/null -w '%{http_code}\n' https://platform.thedisciplineprogram.com/api/v1/trainingLevel/all
```

- [ ] both answer `200`. A `308` on either means the rule is catching the product's own domain --
      revert the deploy before doing anything else.

### 2. Add the apex to the platform project _(dashboard)_

- [ ] Add `thedisciplineprogram.com` as a domain on the **platform** Vercel project.
- [ ] Add the `_vercel` TXT record Vercel asks for, and wait for it to verify.
- [ ] Do **not** configure a domain-level redirect on it in the dashboard. That redirects every path
      including `/api/v1`, which is the one thing the apex exists to serve.
- [ ] Note the A-record target Vercel gives for the apex; the flip in step 6 uses it.

### 3. Prove the routing before any DNS moves

With the domain added but DNS still pointing at the VPS, address the Vercel edge directly and give it
the apex `Host` and SNI by hand:

```
curl -k -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' \
  --resolve thedisciplineprogram.com:443:<vercel-ip> https://thedisciplineprogram.com/
curl -k -sS -o /dev/null -w '%{http_code}\n' \
  --resolve thedisciplineprogram.com:443:<vercel-ip> https://thedisciplineprogram.com/api/v1/trainingLevel/all
curl -k -sS -o /dev/null -w '%{http_code}\n' \
  --resolve thedisciplineprogram.com:443:<vercel-ip> \
  -H 'Authorization: not-a-real-token' 'https://thedisciplineprogram.com/api/v1/program?userId=1&scheduledDate=2026-01-01'
```

- [ ] `/` answers **308** with `Location: https://www.thedisciplineprogram.com/`
- [ ] `/api/v1/trainingLevel/all` answers **200** (the catalogue, no auth needed)
- [ ] a garbage token on `/api/v1/program` answers **403** — never 401, which would not sign the app
      out, and never a redirect, which would mean the exclusion pattern is wrong

The third one is the check that matters most: it proves the redirect is not swallowing the shim. If
`/api/v1/...` answers 308, stop — the `source` pattern in `apps/platform/vercel.json` is wrong and
nothing else in this runbook should be attempted.

### 4. Shorten the TTL _(dashboard)_

- [ ] Drop the apex A record's TTL to 60 s and wait out the old TTL before flipping. This is what
      makes the rollback below take a minute rather than an afternoon.

### 5. Final data sync

Both runs come off **one fresh, same-day dump**, taken after the legacy app has stopped being
published to for the day.

- [ ] Fresh SSH dump → restore → export both files
      (`legacy-users-import.md` §1, `legacy-days-backfill.md` §1)
- [ ] Users import: dry run against production
- [ ] **Owner reads the dry run**, including `ACTION REQUIRED — app password changes` (expect the
      seven attach athletes) and `ACTION REQUIRED — login address changes`
- [ ] Every athlete on those two lists has been told, and the two checkboxes in
      `legacy-users-import.md` §"Pre-cutover fidelity check" are ticked
- [ ] Users import: pinned apply, `conflicts 0`
- [ ] Days backfill: dry run against production — expect `fill + fill-from-newer-row +
missing-in-legacy = 134` and `already-filled (skipped) 120`
- [ ] Days backfill: pinned apply, `conflicts 0`
- [ ] Re-run both dry runs: the users import reports every row as a refresh with `no change`, and the
      backfill reports `fill 0 · fill-from-newer-row 0`

### 6. Flip the DNS _(dashboard)_

- [ ] Apex A record → the Vercel address from step 2
- [ ] Proxy **off** (DNS-only). A proxied record puts Cloudflare between the app and the edge, which
      is a second TLS terminator nobody has tested against this app.
- [ ] Leave the VPS running. It is the rollback.

### 7. Certificate

- [ ] Wait for Vercel to issue the apex certificate. `/.well-known` is reserved by the platform and
      cannot be redirected, so the catch-all in `vercel.json` does not interfere with issuance.
- [ ] Repeat the three curl checks from step 3 **without** `--resolve` and **without** `-k`, so they
      go through real DNS and a real certificate.

### 8. Phone smoke

On a real device, on cellular data (not the office network, which may still hold a DNS cache):

- [ ] The demo athlete signs in, browses several published days, opens the profile, signs out
- [ ] The owner signs in **with his platform password** — not his old legacy one; that is the AS-22
      consequence, and it is the first live confirmation of it
- [ ] One of the backfilled dates renders a day rather than an empty screen
- [ ] A date in the `missing-in-legacy` list renders as empty, which is expected and correct

### 9. Soak, then decommission

- [ ] Watch Sentry and the Vercel logs for the first hours: 403s on `/api/v1/*` are sign-outs and are
      the signal that matters
- [ ] **Leave `LEGACY_MOBILE_API_BASE_URL` and `MOBILE_PUBLISH_ENCRYPTION_KEY` set in Vercel.**
      `/api/v1/program` still module-initialises `@repo/env/mobile-publish`: `program-dto.ts` imports
      the `infrastructure/legacy-mobile` barrel, which pulls the REST adapter, which reads them. They
      stop being required only when P4.1 removes that edge -- unsetting them at decommission would
      500 the shim's busiest route.
- [ ] Keep the VPS up for the agreed soak window
- [ ] Only then move to P3.3

### Rollback

At any point before the VPS is decommissioned:

- [ ] Apex A record → the VPS address, proxy on as it was
- [ ] With the TTL at 60 s this is a minute, not an afternoon
- [ ] The data written in step 5 stays. It has to: the imports are additive, the backfill only ever
      filled empty rows, and the legacy backend never reads either table.

## What this runbook does not decide

- Rate limiting on the shim is a no-op in production today (AS-9). The owner has taken that as
  post-cutover product polish; it is not a gate here.
- The zone itself still lives in somebody else's Cloudflare account (AS-23). The flip works from the
  access the owner already has; moving the zone is P4.

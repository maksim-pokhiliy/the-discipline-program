# apex-sunset — deferred

Carry-forwards: findings/obligations not yet scheduled, with disposition + status.
**Promote here at every gate.**

**Status:** `OPEN` · `SCHEDULED` · `CLOSED` · `DROPPED`.

| ID   | One-liner                                                                                                                                                       | Disposition                                                                                                                                        | Status    |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| AS-1 | Apple Developer membership LAPSED (not renewed 2026) + App Store Connect access                                                                                 | Listing still live (verified 2026-08-07) but delisting is a matter of time; $99 renewal = owner+Denys product call; access ask rides P0.3          | OPEN      |
| AS-6 | Vladyslav's daily Dropbox DB dump — unverified for a year                                                                                                       | Fast path for 0.2: get the folder/latest file, verify freshness + both-schemas completeness + a harness restore; SSH still needed for cutover day  | OPEN      |
| AS-2 | `/dev-api` (DEBUG builds' target) dies with the VPS                                                                                                             | Accepted — we don't ship DEBUG builds; the Appetize stand patches its own base URL                                                                 | OPEN      |
| AS-3 | XCUITest smoke (login → day → profile) in CI on the macOS runner                                                                                                | Optional 4th e2e layer (D-5); adopt if the Appetize stand proves too manual over the initiative's life                                             | OPEN      |
| AS-4 | `mobile-publish` UI carry-forwards that SURVIVE the decommission (MP-24/25/26/27 status-UX class, MP-28 api-client date class, MP-2 weight-baking, MP-11 notes) | Re-home at P4.2 — decide per item: keep in the simplified publish UI backlog, or close                                                             | SCHEDULED |
| AS-5 | Fate of `MobileConnection`, the AES token cipher, `MOBILE_PUBLISH_ENCRYPTION_KEY`, `LEGACY_MOBILE_API_BASE_URL`, `infrastructure/legacy-mobile/`                | P4.1 design: the snapshot model needs publish TARGETS (`MobilePublishLink` likely survives) but no foreign auth — connection/cipher likely deleted | SCHEDULED |

## Detail on the live ones

- **AS-1.** "Не против" (2026-08-07) must be concretized into transferable access: App Store Connect role (or app transfer to Denys's account), signing assets. The cutover itself needs ZERO releases (D-1), so this rides in parallel — but the redesign initiative is blocked without it, and today the sole author's Xcode is the only release path (bus factor 1). **Update (same evening):** Vladyslav's membership is NOT renewed for 2026 — releases are impossible today, and the storefront listing (live as of 2026-08-07, v1.0.9) will be delisted when Apple processes the lapse: installed copies keep working, NEW downloads stop. The $99 renewal is a product call (urgent only if Denys needs to onboard new athletes into the app before the redesign initiative). App Transfer to a project-owned account needs ACTIVE membership on BOTH sides — factor that into the renewal timing.
- **AS-6.** The dump's existence softens the "single un-backed-up copy" risk but replaces it with an unverified-backup risk: set up a year ago, never checked since. Verification checklist: (1) latest file dated within 24h; (2) restore into the local harness DB; (3) row counts vs the live API probes; (4) does it capture the `/dev-api` schema too, and with which pg_dump flags. If the cron turns out dead or partial, 0.2 falls back to the SSH path unchanged.
- **AS-4.** The publish RESULTS/status UX carry-forwards were born against the connector but describe our own UI — most survive the mechanism swap (snapshots make some easier: e.g. MP-25's "partial week" gains an honest source of truth). Sweep `mobile-publish/deferred.md` at P4.2 with the snapshot model in hand.
- **AS-5.** Guiding line: delete what existed only because legacy was a foreign black box (cipher, reconnect, adapter, retry-vs-409 emulation); keep what expresses the coach's intent (links as publish targets, the published-day ledger extended into snapshots per D-4).

## Closed history

_(empty at founding)_

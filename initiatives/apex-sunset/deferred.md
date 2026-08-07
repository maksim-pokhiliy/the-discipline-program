# apex-sunset — deferred

Carry-forwards: findings/obligations not yet scheduled, with disposition + status.
**Promote here at every gate.**

**Status:** `OPEN` · `SCHEDULED` · `CLOSED` · `DROPPED`.

| ID   | One-liner                                                                                                                                                       | Disposition                                                                                                                                        | Status    |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| AS-1 | App Store Connect / Apple developer account access from Vladyslav                                                                                               | P0.3 asks; needed for the FUTURE redesign initiative + bus factor, NOT a cutover blocker                                                           | OPEN      |
| AS-2 | `/dev-api` (DEBUG builds' target) dies with the VPS                                                                                                             | Accepted — we don't ship DEBUG builds; the Appetize stand patches its own base URL                                                                 | OPEN      |
| AS-3 | XCUITest smoke (login → day → profile) in CI on the macOS runner                                                                                                | Optional 4th e2e layer (D-5); adopt if the Appetize stand proves too manual over the initiative's life                                             | OPEN      |
| AS-4 | `mobile-publish` UI carry-forwards that SURVIVE the decommission (MP-24/25/26/27 status-UX class, MP-28 api-client date class, MP-2 weight-baking, MP-11 notes) | Re-home at P4.2 — decide per item: keep in the simplified publish UI backlog, or close                                                             | SCHEDULED |
| AS-5 | Fate of `MobileConnection`, the AES token cipher, `MOBILE_PUBLISH_ENCRYPTION_KEY`, `LEGACY_MOBILE_API_BASE_URL`, `infrastructure/legacy-mobile/`                | P4.1 design: the snapshot model needs publish TARGETS (`MobilePublishLink` likely survives) but no foreign auth — connection/cipher likely deleted | SCHEDULED |

## Detail on the live ones

- **AS-1.** "Не против" (2026-08-07) must be concretized into transferable access: App Store Connect role (or app transfer to Denys's account), signing assets. The cutover itself needs ZERO releases (D-1), so this rides in parallel — but the redesign initiative is blocked without it, and today the sole author's Xcode is the only release path (bus factor 1).
- **AS-4.** The publish RESULTS/status UX carry-forwards were born against the connector but describe our own UI — most survive the mechanism swap (snapshots make some easier: e.g. MP-25's "partial week" gains an honest source of truth). Sweep `mobile-publish/deferred.md` at P4.2 with the snapshot model in hand.
- **AS-5.** Guiding line: delete what existed only because legacy was a foreign black box (cipher, reconnect, adapter, retry-vs-409 emulation); keep what expresses the coach's intent (links as publish targets, the published-day ledger extended into snapshots per D-4).

## Closed history

_(empty at founding)_

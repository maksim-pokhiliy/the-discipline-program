# post-uat — state (the board)

**Updated:** 2026-07-28 (late) — **W1 IS IN PR and has passed the tech-lead diff review** (`fix/uat-athlete-pack`). The review returned five one-line items, all applied in the micro-round: the catalog status no longer reports failure over data already in hand; `listForAthlete`'s missing service guard is recorded as a ratified acceptance beside `resendInvite`; the wrapping group moved to `useFlexGap`; one unit test renamed to stop promising a rule the domain cannot produce; and — **the owner's override** — the `SchemaRow` left-edge flip was fixed here after all rather than carried forward, so a wrapped metric now lands right in both row forms. Both behavioural changes mutation-verified. Remaining: the owner's browser pass.

<details><summary>Earlier the same day — W1 enters PR</summary>

**W1 IS IN PR** (`fix/uat-athlete-pack`, three commits). The `/fix` pipeline re-proved PU-01 at runtime (real `RecordsContent`, fresh-athlete payload → `options: []` + "No options") and corrected the PU-02 brief twice: the evidence list was missing a fourth property (`schema-row.tsx:127` `flex: "0 0 auto"`, without which dropping `nowrap` is a measured no-op), and "2×2 is the longest string" is refuted — the domain permits an unbreakable 100-char coord, so `overflowWrap: "anywhere"` is mandatory. A `max` code review then found three real defects including **one regression W1 itself introduced** (removing `flexShrink` let a long movement name break a short metric at 320px); all three fixed and mutation-verified. D-6.1 ratified. Details in the journal entry for 28.07.

</details>

<details><summary>Previous header (27.07 late)</summary>

**ALL DECISIONS RESOLVED (D-1..D-6) → BOTH EXECUTOR PROMPTS WRITTEN.** Second owner round: **D-4 RATIFIED as NO interim mitigation** («ничего не инертим и не делаем временных заплаток — сразу делаем нормально; до тех пор Ден живёт с тем что есть») → PU-05 folded into PU-13 (profiling v2), the advisory/audit sketches dropped. **D-6 RATIFIED = (a)** — athletes get the read-only movement catalog («пусть ставит что хочет»). **PU-03 venue corrected:** Tetiana was switching RX/SC on her PROFILE page (where the active pick IS shown correctly) — the tension is that the WORKOUT screen never names the active level and offers no in-session re-switch; the fix set (resolved-coords label + re-openable prompt + RowGroup editor) is unchanged. TikTok link — accidental paste, unrelated, DROPPED. Prompts ready: **`prompt-fix-a-admin.md`** (urgent, `fix/admin-soft-delete-reads`) + **`prompt-w1-athlete-pack.md`** (PU-01..04, `fix/uat-athlete-pack`). **Build-loop standard ratified same day** (`docs/process.md` § "The build loop"): tech lead orders the queue and the executor count (parallel allowed when needed) — current call: Fix-A first, W1 after its merge. **UPDATE (late, +5) — Fix-A IN EXEC on `fix/admin-soft-delete-reads`, and its Finding 1 was REFUTED at runtime:** soft-delete filtering is central (`db/client.ts` `$extends`), so the list-brick never existed; Fix A ships as regression guards only (zero production diff) and **the prod user-delete freeze is lifted**. Fix A′ (honest UI) ships as specified, hiding exactly what 403s. See `triage.md` § PU-06 "Investigation outcome" + the D-2 addendum.

</details>

## Board

| Wave  | Scope                                            | Status                                             |
| ----- | ------------------------------------------------ | -------------------------------------------------- |
| Fix-A | Admin soft-delete reads + honest-UI (PU-06)      | ✅ MERGED — PR #338 (`11842574`), full loop passed |
| W1    | Athlete pack — CUT to PU-01/02 (corpus read)     | 🔵 IN PR — diff review passed, browser pass next   |
| Wd    | Design round: PU-03 + PU-04 (Claude Design)      | queued — tech lead prepares the design brief       |
| W2    | Publish status (PU-08 → MP-22, `/feature small`) | approved; prompt after W1                          |
| W3    | Email edit under ADMIN (PU-07)                   | approved (D-2)                                     |
| W4    | Reach & notify (PU-09/10/11) → PU-17 templates   | fully unblocked (links received 27.07)             |
| W5    | Athlete session screen v2 (PU-12)                | scoped; design-first, likely spin-off              |
| W6    | Profiling v2 (PU-13, absorbs PU-05)              | scoped; design-first, sacred-VO gate               |
| W7    | Subscriptions charter (PU-14)                    | scope set by owner 27.07; charter at W7            |

## Next action

**▶ Owner: the W1 browser pass** — the diff review is done (five items, all applied; see the header). `fix/uat-athlete-pack` carries the athlete movement catalog, the spread-line wrapping, a review round that fixed three confirmed defects (a failed catalog fetch silently recreated the dead picker; clearing the movement field silently re-selected the preset, so a max could save against the wrong movement; and removing `flexShrink` let a long movement name break a short metric at 320px — the last one a regression W1 itself introduced, caught by the `max` review and settled by measurement, not argument). D-6.1 was ratified at the plan gate: the CONCRETE filter is on the catalog query only, never on the athlete's own record movements. **What needs the owner's eye at the browser pass:** the 320px screenshots — wrapping is the ratified call over chips, so the vertical cost is accepted, but the grouped path actually gets _shorter_, not taller. The `SchemaRow` left-edge flip that used to belong on this list was fixed in the micro-round at the owner's call, so a wrapped metric now lands right in both row forms; what still differs between them is the air above a wrapped line (12 px in `RowGroup` via `useFlexGap`, none in `SchemaRow`) — recorded in `deferred.md`, one token to close if it reads wrong on the phone. **PU-01 cannot be machine-verified end-to-end:** jsdom cannot drive MUI's Autocomplete typing, so "typing `squat` offers catalog movements" is the owner's pass alone, and `db:seed` produces no athlete fixture — the walkthrough needs an athlete created via the invite flow.

<details><summary>Superseded next-action (27.07 — kept for the trail)</summary>

**▶ Owner: carry the RE-CUT `prompt-w1-athlete-pack.md` to a fresh executor session** (pick `post-uat` at the hook question). The corpus read (27.07) CUT W1 from four findings to two: **PU-01 (athlete movement catalog) + PU-02 (spread-line wrapping)** ship now; **PU-03 + PU-04 go to a Claude-Design round first (Wd)** — both work correctly at runtime (on the level switch EVERYTHING updates, including the kg — the athlete just could not perceive that it applied), so the remaining work is interaction design, not a bug fix. The prompt and corpus are re-cut accordingly (D-7); the dropped contract deltas (resolved coords, exercise identity) belong to Wd's outcome. Context: Fix-A completed the full loop as **PR #338** (`11842574`); owner prod re-check closes PU-06 as VERIFIED. Social links complete (YT/TG/IG/Strava) — W4 fully unblocked.

</details>

## Open decisions awaiting ratification

**(none)** — D-1..D-7 all resolved (D-6.1 addendum ratified 28.07 at the W1 plan gate). Next decision points arise at the W5/W6 design passes and the W7 charter.

## Gotchas a resuming session must know

- **Two initiatives ACTIVE in parallel** (`post-uat` + `mobile-publish`) — W2/PU-08 executes under `mobile-publish` (MP-22), not here.
- **Prod user deletion is UNBLOCKED (2026-07-27).** The old standing freeze ("no user deletion in the prod admin until Fix-A merges") rested on a list-brick that the Fix-A investigation refuted at runtime — `db/client.ts` filters soft-deleted users centrally for every admin read path. Do not re-introduce the freeze; if you need the reasoning, read `triage.md` § PU-06 "Investigation outcome" before acting on the older paragraphs above it.
- **Soft-delete filtering in this repo is CENTRAL, not per-query.** `db/client.ts:7-16` (`SOFT_DELETE_MODELS`) + `:119-225` (`$extends`) cover top-level `findMany`/`findFirst`/`count`/`aggregate`/`groupBy`/`findUnique`. A missing `where: { deletedAt: null }` at a call site is normal here. **The real gap is nested relation includes — `$extends` does NOT reach them** (see `deferred.md`).
- **D-4 is a standing style rule for this initiative:** no interim patches/advisories — proper fix or live with it. Do not re-propose stopgaps for PU-05-class gaps.
- **W1 constraints:** contract changes additive only; ZERO diff on `load.ts`/`reps.ts` (sacred VOs) and on `mobile-publish/projection/` (published bytes identical, D-17).
- The old Telegram bot code is recoverable verbatim: `git show 38f4a304^:packages/api-server/src/services/notification.service.ts`.
- Athlete-core's demo-day backlog (records benchmark-grouping, blog slugify, future-weeks hiding) stays in `athlete-core/deferred.md` — records-grouping shares the records-view surface with PU-01; cross-check at W1 review.

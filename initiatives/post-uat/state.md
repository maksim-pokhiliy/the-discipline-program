# post-uat — state (the board)

**Updated:** 2026-07-27 (late) — **ALL DECISIONS RESOLVED (D-1..D-6) → BOTH EXECUTOR PROMPTS WRITTEN.** Second owner round: **D-4 RATIFIED as NO interim mitigation** («ничего не инертим и не делаем временных заплаток — сразу делаем нормально; до тех пор Ден живёт с тем что есть») → PU-05 folded into PU-13 (profiling v2), the advisory/audit sketches dropped. **D-6 RATIFIED = (a)** — athletes get the read-only movement catalog («пусть ставит что хочет»). **PU-03 venue corrected:** Tetiana was switching RX/SC on her PROFILE page (where the active pick IS shown correctly) — the tension is that the WORKOUT screen never names the active level and offers no in-session re-switch; the fix set (resolved-coords label + re-openable prompt + RowGroup editor) is unchanged. TikTok link — accidental paste, unrelated, DROPPED. Prompts ready: **`prompt-fix-a-admin.md`** (urgent, `fix/admin-soft-delete-reads`) + **`prompt-w1-athlete-pack.md`** (PU-01..04, `fix/uat-athlete-pack`). **Build-loop standard ratified same day** (`docs/process.md` § "The build loop"): tech lead orders the queue and the executor count (parallel allowed when needed) — current call: Fix-A first, W1 after its merge. **UPDATE (late, +5) — Fix-A IN EXEC on `fix/admin-soft-delete-reads`, and its Finding 1 was REFUTED at runtime:** soft-delete filtering is central (`db/client.ts` `$extends`), so the list-brick never existed; Fix A ships as regression guards only (zero production diff) and **the prod user-delete freeze is lifted**. Fix A′ (honest UI) ships as specified, hiding exactly what 403s. See `triage.md` § PU-06 "Investigation outcome" + the D-2 addendum.

## Board

| Wave  | Scope                                            | Status                                                 |
| ----- | ------------------------------------------------ | ------------------------------------------------------ |
| Fix-A | Admin soft-delete reads + honest-UI (PU-06)      | IN EXEC — `fix/admin-soft-delete-reads`; Gate A passed |
| W1    | Athlete pack (PU-01/02/03/04)                    | PROMPT READY → carry to an executor tab                |
| W2    | Publish status (PU-08 → MP-22, `/feature small`) | approved; prompt after W1                              |
| W3    | Email edit under ADMIN (PU-07)                   | approved (D-2)                                         |
| W4    | Reach & notify (PU-09/10/11) → PU-17 templates   | fully unblocked (links received 27.07)                 |
| W5    | Athlete session screen v2 (PU-12)                | scoped; design-first, likely spin-off                  |
| W6    | Profiling v2 (PU-13, absorbs PU-05)              | scoped; design-first, sacred-VO gate                   |
| W7    | Subscriptions charter (PU-14)                    | scope set by owner 27.07; charter at W7                |

## Next action

**▶ Fix-A is in execution** on `fix/admin-soft-delete-reads` (Gate A passed with an owner-ratified re-scope: Finding 1 refuted → regression guards only; Finding 2 → hide exactly what 403s). Remaining loop steps: PR → tech-lead diff review → owner browser pass → two-ok merge. **W1 (`prompt-w1-athlete-pack.md`) starts only after Fix-A merges.** Corpus stage for Fix-A/W1 is already discharged — `triage.md` §§ PU-06/PU-01..04 + the two owner feedback rounds ARE the read-and-discussed corpus; new items from W2 onward run the full corpus stage explicitly. Social links arrived (27.07, brand YT/TG/IG — `triage.md` § PU-10) — W4 is fully unblocked, nothing external pending anywhere in the queue.

## Open decisions awaiting ratification

**(none)** — D-1..D-6 all resolved. Next decision points arise at the W5/W6 design passes and the W7 charter.

## Gotchas a resuming session must know

- **Two initiatives ACTIVE in parallel** (`post-uat` + `mobile-publish`) — W2/PU-08 executes under `mobile-publish` (MP-22), not here.
- **Prod user deletion is UNBLOCKED (2026-07-27).** The old standing freeze ("no user deletion in the prod admin until Fix-A merges") rested on a list-brick that the Fix-A investigation refuted at runtime — `db/client.ts` filters soft-deleted users centrally for every admin read path. Do not re-introduce the freeze; if you need the reasoning, read `triage.md` § PU-06 "Investigation outcome" before acting on the older paragraphs above it.
- **Soft-delete filtering in this repo is CENTRAL, not per-query.** `db/client.ts:7-16` (`SOFT_DELETE_MODELS`) + `:119-225` (`$extends`) cover top-level `findMany`/`findFirst`/`count`/`aggregate`/`groupBy`/`findUnique`. A missing `where: { deletedAt: null }` at a call site is normal here. **The real gap is nested relation includes — `$extends` does NOT reach them** (see `deferred.md`).
- **D-4 is a standing style rule for this initiative:** no interim patches/advisories — proper fix or live with it. Do not re-propose stopgaps for PU-05-class gaps.
- **W1 constraints:** contract changes additive only; ZERO diff on `load.ts`/`reps.ts` (sacred VOs) and on `mobile-publish/projection/` (published bytes identical, D-17).
- The old Telegram bot code is recoverable verbatim: `git show 38f4a304^:packages/api-server/src/services/notification.service.ts`.
- Athlete-core's demo-day backlog (records benchmark-grouping, blog slugify, future-weeks hiding) stays in `athlete-core/deferred.md` — records-grouping shares the records-view surface with PU-01; cross-check at W1 review.

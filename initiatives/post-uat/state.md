# post-uat — state (the board)

**Updated:** 2026-07-27 (late) — **ALL DECISIONS RESOLVED (D-1..D-6) → BOTH EXECUTOR PROMPTS WRITTEN.** Second owner round: **D-4 RATIFIED as NO interim mitigation** («ничего не инертим и не делаем временных заплаток — сразу делаем нормально; до тех пор Ден живёт с тем что есть») → PU-05 folded into PU-13 (profiling v2), the advisory/audit sketches dropped. **D-6 RATIFIED = (a)** — athletes get the read-only movement catalog («пусть ставит что хочет»). **PU-03 venue corrected:** Tetiana was switching RX/SC on her PROFILE page (where the active pick IS shown correctly) — the tension is that the WORKOUT screen never names the active level and offers no in-session re-switch; the fix set (resolved-coords label + re-openable prompt + RowGroup editor) is unchanged. TikTok link — accidental paste, unrelated, DROPPED. Prompts ready: **`prompt-fix-a-admin.md`** (urgent, `fix/admin-soft-delete-reads`) + **`prompt-w1-athlete-pack.md`** (PU-01..04, `fix/uat-athlete-pack`) — parallel-safe (disjoint zones).

## Board

| Wave  | Scope                                            | Status                                        |
| ----- | ------------------------------------------------ | --------------------------------------------- |
| Fix-A | Admin soft-delete reads + honest-UI (PU-06)      | 🔥 PROMPT READY → carry to an executor tab    |
| W1    | Athlete pack (PU-01/02/03/04)                    | PROMPT READY → carry to an executor tab       |
| W2    | Publish status (PU-08 → MP-22, `/feature small`) | approved; prompt after W1                     |
| W3    | Email edit under ADMIN (PU-07)                   | approved (D-2)                                |
| W4    | Reach & notify (PU-09/10/11) → PU-17 templates   | approved (D-3); PU-10 awaits links from Denys |
| W5    | Athlete session screen v2 (PU-12)                | scoped; design-first, likely spin-off         |
| W6    | Profiling v2 (PU-13, absorbs PU-05)              | scoped; design-first, sacred-VO gate          |
| W7    | Payments charter (PU-14)                         | awaiting Tetiana's brief                      |

## Next action

**▶ Owner: paste `initiatives/post-uat/prompt-fix-a-admin.md` into one executor tab and `initiatives/post-uat/prompt-w1-athlete-pack.md` into another** (each session picks `post-uat` when the session-start hook asks). They are parallel-safe. The tech-lead session then validates each run's Gate A and reviews the PRs against the prompts. Independently: social links from Denys unblock PU-10 (W4).

## Open decisions awaiting ratification

**(none)** — D-1..D-6 all resolved. Next decision points arise at the W5/W6 design passes and the W7 charter.

## Gotchas a resuming session must know

- **Two initiatives ACTIVE in parallel** (`post-uat` + `mobile-publish`) — W2/PU-08 executes under `mobile-publish` (MP-22), not here.
- **🔥 Denys holds a real ADMIN account (D-2): NO user deletion in the prod admin until Fix-A merges** — the first successful soft-delete permanently 500s the users list (suffixed email fails the response schema's `.email()`).
- **D-4 is a standing style rule for this initiative:** no interim patches/advisories — proper fix or live with it. Do not re-propose stopgaps for PU-05-class gaps.
- **W1 constraints:** contract changes additive only; ZERO diff on `load.ts`/`reps.ts` (sacred VOs) and on `mobile-publish/projection/` (published bytes identical, D-17).
- The old Telegram bot code is recoverable verbatim: `git show 38f4a304^:packages/api-server/src/services/notification.service.ts`.
- Athlete-core's demo-day backlog (records benchmark-grouping, blog slugify, future-weeks hiding) stays in `athlete-core/deferred.md` — records-grouping shares the records-view surface with PU-01; cross-check at W1 review.

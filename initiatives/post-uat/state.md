# post-uat — state (the board)

**Updated:** 2026-07-27 (evening) — **OWNER FEEDBACK ROUND FOLDED IN.** Every registry item got an owner verdict the same day it was triaged. Confirmations: PU-02/04/08/09/10/11/14 approved as-is. Re-frames: **PU-03** = the switch WORKED, the feedback was invisible (popover slams shut + resolved line carries no level label — verified in code; the fix converges with PU-05's honesty label into ONE mechanism: resolved-coords on the line). **PU-06** = owner shipped a two-account workaround (Denys now holds a separate ADMIN account) → **D-2 RATIFIED** (Fix B dropped; Fix A now URGENT — the list-brick is a live risk; + honest-UI hide for HEAD_COACH). Scope expansions: **PU-12** → athlete session screen v2 (guided execution, full screen rework, likely spin-off initiative), **PU-13** → profiling v2 (design-first; owner: "профайлинг сырой, нужно проектировать"), **PU-15** → ALL domain mailboxes, **PU-17 NEW** (email template redesign, Claude Design). **PU-16 CLOSED** (plan was simply unpublished). Ratified: **D-2, D-3, D-5**. Still open: **D-4** (cardio-load advisory) + **D-6** (1RM picker scope — owner's "это по дизайну?" answered: no, it's athlete-record-scoped, not coach-benchmark-scoped; fork a/b with recommendation).

## Board

| Wave     | Scope                                                | Status                                        |
| -------- | ---------------------------------------------------- | --------------------------------------------- |
| W3-Fix-A | Admin soft-delete list-brick (PU-06)                 | 🔥 URGENT — ship standalone ASAP (live risk)  |
| W1       | Athlete pack (PU-02/03/04 + 01 per D-6 + 05 per D-4) | ⏳ next — blocked only on D-4 + D-6           |
| W2       | Publish status (PU-08 → MP-22, `/feature small`)     | approved; spec'd 16.07                        |
| W3-rest  | Honest-UI hide (Fix A′) + email edit (PU-07)         | approved (D-2)                                |
| W4       | Reach & notify (PU-09/10/11) → then PU-17 templates  | approved (D-3); PU-10 awaits links from Denys |
| W5       | Athlete session screen v2 (PU-12)                    | scoped; design-first, likely spin-off         |
| W6       | Profiling v2 (PU-13)                                 | scoped; design-first, sacred-VO gate          |
| W7       | Payments charter (PU-14)                             | awaiting Tetiana's brief                      |

## Next action

**▶ Owner: ratify D-4 (cardio-load advisory — yes/no) + D-6 (1RM picker: open catalog vs legalize + empty-state), get the social links from Denys, answer the TikTok question.** The moment D-4/D-6 land → tech-lead session writes TWO executor prompts: the standalone **Fix A mini-fix** (`/fix`, can go first and immediately — until it ships, NO user deletion in prod admin) and the **W1 athlete pack** (`/fix`, one branch `fix/uat-athlete-pack`), then validates their Gate A and reviews the PRs per the charter operating model.

## Open decisions awaiting ratification

**D-4** (PU-05 mitigation = advisory, not hard block; interim until profiling v2) · **D-6** (1RM movement-picker scope, fork a/b — recommendation: open the catalog). Both with full context in `decisions.md`.

## Gotchas a resuming session must know

- **Two initiatives ACTIVE in parallel** (`post-uat` + `mobile-publish`) — W2/PU-08 executes under `mobile-publish` (MP-22), not here.
- **🔥 Denys now holds a real ADMIN account (D-2): do NOT delete users in the prod admin until Fix A ships** — the first successful soft-delete permanently 500s the users list (suffixed email fails the response schema's `.email()`).
- **PU-13 touches sacred VOs** (`load.ts`/`reps.ts` zero-diff rule) — never fold into a fix wave; own design + four-projection gate.
- **PU-05 mitigation must not change published bytes** — `format-legacy-schema.ts` untouched (D-17 parity).
- The old Telegram bot code is recoverable verbatim: `git show 38f4a304^:packages/api-server/src/services/notification.service.ts`.
- The resolved-coords label (PU-03a/PU-05c) is ONE mechanism — spec it once, in W1.
- Athlete-core's demo-day backlog (records benchmark-grouping, blog slugify, future-weeks hiding) stays in `athlete-core/deferred.md` — don't double-book; records-grouping shares the records-view surface with PU-01.

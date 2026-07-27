# post-uat — state (the board)

**Updated:** 2026-07-27 — **INITIATIVE OPENED.** UAT closed 2026-07-27; the full feedback corpus (Telegram thread 27.06–26.07 + 10 screenshots + FB message + the 16.07 publish incident) is triaged and **root-caused in code** (6 parallel recon agents; evidence + STR per item in `triage.md`). 16 registry items across 7 waves (`plan.md`): 7 bugs (all with confirmed root cause), 1 ready-spec'd UX fix (→ MP-22 in `mobile-publish`), 5 features, 1 initiative candidate (payments), ops + investigate tails. Denys got the UAT-summary update. The initiative runs owner-in-the-loop: owner reproduces from STRs and ratifies; tech-lead session writes prompts, validates Gate A + PRs; executors in parallel tabs (charter § Operating model).

## Board

| Wave | Scope                                            | Status                              |
| ---- | ------------------------------------------------ | ----------------------------------- |
| W1   | Athlete pack (PU-01..05, `fix/uat-athlete-pack`) | ⏳ next — awaiting owner repro pass |
| W2   | Publish status (PU-08 → MP-22, `/feature small`) | ready — spec'd 16.07                |
| W3   | Admin (PU-06 A+B, PU-07)                         | Fix A ready; B gated D-2            |
| W4   | Reach & notify (PU-09..11)                       | gated D-3 (+ handles confirm)       |
| W5   | Guided timer (PU-12)                             | scoped, not designed                |
| W6   | Per-gender volume (PU-13)                        | scoped, sacred-VO gate              |
| W7   | Payments charter (PU-14)                         | awaiting Tetiana's brief            |

## Next action

**▶ Owner repro pass on W1 (PU-01..PU-05) from the STRs in `triage.md`** — PU-06's STR is DEV-DB-ONLY (a prod ADMIN delete would soft-delete a real user + brick the admin users list). In the same sitting: ratify **D-2** (HEAD_COACH admin powers), **D-3** (Telegram resurrection), **D-4** (cardio-load advisory approach), **D-5** (1RM correction = append) — recommendations recorded in `decisions.md`. Then the tech-lead session writes the W1 executor prompt (`/fix`, one branch) and validates its Gate A.

## Open decisions awaiting ratification

**D-2** (HEAD_COACH capability in admin) · **D-3** (Telegram bot resurrection vs roadmap "v1.1+") · **D-4** (PU-05 mitigation = advisory, not hard block) · **D-5** (PU-04 correction = append, not history edit). All carry recommendations in `decisions.md`.

## Gotchas a resuming session must know

- **Two initiatives are ACTIVE in parallel** (`post-uat` + `mobile-publish`, multi-active flow since 2026-07-27) — W2/PU-08 work happens under `mobile-publish` (MP-22), not here.
- **PU-06 repro/testing: dev DB only** until Fix A ships (prod list-brick risk).
- **PU-13 touches sacred VOs** (`load.ts`/`reps.ts` zero-diff rule) — never fold it into a fix wave; own design + four-projection gate.
- **PU-05 mitigation must not change published bytes** — `format-legacy-schema.ts` untouched (D-17 parity).
- The old Telegram bot code is recoverable verbatim: `git show 38f4a304^:packages/api-server/src/services/notification.service.ts`.
- Athlete-core's demo-day backlog (records benchmark-grouping, blog slugify, future-weeks hiding) stays in `athlete-core/deferred.md` — don't double-book; cross-check before W5/W6 scoping.

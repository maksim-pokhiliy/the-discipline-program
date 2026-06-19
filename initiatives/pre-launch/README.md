# pre-launch — non-athlete tail to the demo-script

Planner-owned `/feature` prompts for the **pre-launch scope** items that are NOT part of the `athlete-core` initiative (see `docs/roadmap.md` → Block 1). This is **not tracked as a full initiative** (no charter/state board) — `athlete-core` stays `ACTIVE`. Each file here is a brief for one executor session (run in an isolated worktree).

Roadmap Block 1 status — the non-athlete items:

| #   | Item                              | Status / pointer                                                                                  |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------- |
| 3   | Coach enrolls athletes into plans | ✅ **Shipped (#290)** — `coach-enroll-athletes-feature-prompt.md` (this folder)                   |
| 4   | Lifecycle email templates         | lead-notify ✅ shipped (#287); invite done; only the password-reset email remains — lands with #5 |
| 5   | Password reset / recovery         | infra (auth)                                                                                      |
| 6   | Head-coach → admin access         | ✅ **DONE** (verified 2026-06-19 — role-gate + admin marketing-CMS already shipped; see roadmap)  |
| 7   | Marketing "buy" → lead-capture    | ✅ **Shipped (#287)** — `marketing-lead-capture-feature-prompt.md` (this folder)                  |

Athlete items (#1 Records → #288, #2 Profile → #286) are both shipped; they live in `initiatives/athlete-core/`.

**Pre-launch remaining:** only **#5 password reset** (+ the password-reset email half of #4) is still open. #3/#6/#7 shipped; #1/#2 shipped (athlete-core).

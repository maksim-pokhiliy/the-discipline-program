# pre-launch — non-athlete tail to the demo-script

Planner-owned `/feature` prompts for the **pre-launch scope** items that are NOT part of the `athlete-core` initiative (see `docs/roadmap.md` → Block 1). This is **not tracked as a full initiative** (no charter/state board) — `athlete-core` stays `ACTIVE`. Each file here is a brief for one executor session (run in an isolated worktree).

Roadmap Block 1 status — the non-athlete items:

| #   | Item                              | Status / pointer                                                                                             |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 3   | Coach enrolls athletes into plans | ✅ **Shipped (#290)** — `coach-enroll-athletes-feature-prompt.md` (this folder)                              |
| 4   | Lifecycle email templates         | ✅ **Complete** — lead-notify (#287), invite, and the password-reset email (ships with #5) all fire          |
| 5   | Password reset / recovery         | ✅ **Done (#291)** — `password-reset-feature-prompt.md` + `password-reset-closeout.md`; mirrors invite-token |
| 6   | Head-coach → admin access         | ✅ **DONE** (verified 2026-06-19 — role-gate + admin marketing-CMS already shipped; see roadmap)             |
| 7   | Marketing "buy" → lead-capture    | ✅ **Shipped (#287)** — `marketing-lead-capture-feature-prompt.md` (this folder)                             |

Athlete items (#1 Records → #288, #2 Profile → #286) are both shipped; they live in `initiatives/athlete-core/`.

**Pre-launch remaining:** none — Block 1 is complete. #5 password reset shipped (#291), closing the last open item and the password-reset-email half of #4. Everything else was already shipped: #1/#2 (athlete-core), #3/#6/#7. Remaining before launch is the deployment tail (prod env-vars incl. the Upstash rate-limiter — see `password-reset-closeout.md` launch gate).

---
name: initiative-resume
description: "Resume the active big-feature initiative (initiatives/ACTIVE): load its durable docs in the right order so you have full context before acting. Use at the start of a session that continues a big feature, or when the user says resume / pick up / continue the initiative. The SessionStart hook already injects the board; this loads the rest."
---

# Initiative resume

Load the active initiative's durable context before doing anything. Trust the promoted distillate (`decisions.md`/`deferred.md`/design docs) over re-deriving from code or an old chat.

## Steps

1. **Find it.** Read `initiatives/ACTIVE` (the slug). The SessionStart hook has already printed `state.md` (the board) into context — if not, read `initiatives/<slug>/state.md`.

2. **Read in order:**

   - `charter.md` — goal · scope · non-goals · acceptance · driving ADR(s).
   - `state.md` — the board + the one next action (already loaded).
   - `decisions.md` — at minimum every `OPEN` entry (these gate execution — do NOT act past an OPEN decision without ratification), and the `RATIFIED` ones relevant to the next step.
   - `deferred.md` — every `OPEN`/`SCHEDULED` carry-forward.
   - `plan.md` — the step's place in the roadmap.
   - any design docs the next action points at (recon docs, specs).

3. **Honor the gotchas** in `state.md` (frozen contracts, superseded dirs, sacred code).

4. **Then act** on the board's "Next action." If it's a code step, that's a `/feature` (or ultracode workflow) launch; if it's "ratify D-N," surface the open decision to the user with a recommendation — don't decide it silently.

Do not start from code archaeology or a re-read of git history when the initiative docs already hold the answer.

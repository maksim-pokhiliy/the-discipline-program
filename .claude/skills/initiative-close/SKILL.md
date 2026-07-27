---
name: initiative-close
description: "Run the initiative close-out checklist for the active initiative (initiatives/ACTIVE): promote ratified decisions + carry-forwards from scratch/.feature-dev/external-chat into the durable initiative docs, update the board + journal + plan, one docs commit. Use at the end of any session that touched the active initiative, or when the user says close out / wrap up the initiative."
---

# Initiative close-out

Bring the active initiative's durable docs up to date so the next session resumes cleanly with zero hand-feeding. The discipline: **nothing load-bearing stays only in gitignored `.feature-dev/` or an external chat.**

## Steps

1. **Identify the active initiative.** Read `initiatives/ACTIVE` (one slug per line; several = parallel tracks) and `initiatives/CURRENT` (this session's pick). Close out the initiative THIS session touched — normally the `CURRENT` one; if the session touched more than one, run the checklist per initiative. If the user named a different one, use that.

2. **Promote decisions.** Every decision ratified this session (a Gate-A call, a fork the user chose, a primitive/contract/sequencing call) → add or update an entry in `decisions.md`: D-id · one-liner · **rationale (the contentful why, not "we agreed")** · status (`RATIFIED`/`OPEN`/`SUPERSEDED`) · links. If reasoning lived only in a `/feature` run's `.feature-dev/<ts>/{design,qa,review}.md` or an external chat — distil it here now. Cross-initiative architecture calls → a `docs/adr/` instead, linked from the charter.

3. **Promote carry-forwards.** Every new finding/obligation (QA WARNING, follow-up, deferral) → `deferred.md` with a disposition + status. Move anything that got done to `CLOSED`.

4. **Update the board** (`state.md`): the status table (move the cursor) + the ONE concrete next-action handoff + the open-decisions / live-carry-forwards pointers + gotchas.

5. **Append `journal.md`** — a dated entry: what shipped (commits, what the run did), what was decided, what's next.

6. **Update `plan.md`** — step/sub-step statuses.

7. **One docs commit** (only if the user wants a commit this session — otherwise leave staged/unstaged per their workflow). Conventional-commits, lowercase, no AI-trailers.

## Checklist to confirm before declaring closed

- [ ] Every decision made this session is in `decisions.md` with a rationale (not just in chat / `.feature-dev/`).
- [ ] Every new WARNING/follow-up is in `deferred.md` with a disposition.
- [ ] `state.md` board reflects reality + names the single next action.
- [ ] `journal.md` has this session's entry.
- [ ] `plan.md` statuses match the board.

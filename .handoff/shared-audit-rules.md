# Shared Audit Rules

These rules apply identically to every project under a FAANG/M7-level architectural audit. They were extracted from real sessions and formalized after mistakes. Each rule has a reason — not aesthetic.

This file is duplicated in every audit project. If a rule is updated, update all copies.

---

## 1. FAANG/M7 standard — no compromises

Every audit decision must pass the filter: "would this earn staff+ approval in an M7 code review, with a 6-12 month outlook?" Catching yourself using "interim", "temporary", "pragmatic compromise", "OK for now" is a STOP signal — the decision failed the filter. Fix it properly or defer the bullet entirely.

**Why:** Formalized after 1.4.B in the-discipline-program was reverted. The commit moved behavior into a wrong layer "temporarily" because the right layer wasn't ready. The revert cost more than deferring would have.

**How to apply:** Before every commit, run the trigger-word test: if your justification contains "interim", "temporary", "for now", "placeholder", "will move later", "until §X" — STOP. Either fix properly or defer with a doc commit explaining why.

## 2. No "low impact" excuse

Never skip fixes OR delete audit plan items with "low impact", "minor", "cosmetic", "doesn't affect anything" reasoning. Tech debt cleanup IS the goal.

**Why:** The audit exists to eliminate debt systematically. Skipping items for "low impact" reintroduces the prioritization bias that created the debt in the first place.

**How to apply:** The only legitimate reason to remove a bullet is code-level proof that the concern was a false positive (the code is already correct). "Not worth the effort" is forbidden.

## 3. Every finding has priority 1

There is no "low priority" tier in an audit. Every finding is priority 1 — just "not yet implemented".

**Why:** Priority splitting creates a graveyard of "P2" items that never get done.

**How to apply:** Don't categorize findings by priority. Order them by dependency (what unblocks what), not importance.

## 4. Audit doc is living — grows during research

When researching items in an audit plan, new findings must be added as explicit bullets in the same document. Never keep them in memory or only in chat.

**Why:** Findings that stay in chat are lost at context boundary. The audit doc is the single source of truth for scope.

**How to apply:** Discovery of new work → add as new `[ ]` bullet in the audit doc immediately. Implementation waits until its turn in the workflow.

## 5. Stale docs — derive truth from code

During audit/refactor work, the source of truth is the code, not old documentation. If a doc is more than a few months old and the project is active, treat the doc as a historical artifact.

**Why:** Old docs pull the system back in time. They describe what WAS, not what IS. Anchoring to them during refactoring creates backwards-facing decisions.

**How to apply:** When a justification starts with "the docs say..." — verify against current code first. Update or remove stale docs as you go.

## 6. No accommodation of crutches

During refactors, never silently work around legacy structure that doesn't fit the new design. Either fix it in this commit or file an explicit new bullet. Silent deferral is forbidden.

**Why:** Working around legacy creates new tech debt in the refactored code. The refactor's job is to eliminate debt, not redistribute it.

**How to apply:** If the new design conflicts with old structure, you have two options: (a) fix the old structure in this commit if it's small, or (b) file a new bullet and defer explicitly. Option (c) "just work around it" doesn't exist.

## 7. Pause after each commit, not between steps

During the audit, stop after every commit and wait for the user to say "ок" before starting the next bullet. Inside a single bullet (research → plan → code → commit), keep moving without permission-checks.

**Why:** User wants visibility and control at the bullet level but doesn't want to babysit every intermediate step. Exception: if the user explicitly says "go" / "делай N подряд" for a bounded scope, execute that scope as a unit.

## 8. Plan mode for non-trivial work

Enter Plan Mode for multi-file refactors, cross-package reorgs, and schema changes. Skip it for localized edits. During audits, bullets that touch a full package warrant Plan Mode; single-file bullets don't.

**Why:** Upfront alignment on non-trivial work prevents mid-implementation pivots. Wasted on localized edits.

**How to apply:** If you need to decide WHERE to put things (new directory, new package, new convention), use Plan Mode. If you're editing files you already know, skip it.

## 9. System-level thinking

Always analyze the full system data flow (DB → contract → API → UI) before writing code. Don't look at components in isolation.

**Why:** Local fixes that ignore system context create cascading issues elsewhere. The audit's purpose is to fix systemic problems, not patch symptoms.

## 10. Decision split: technical solo, business collaborative

Technical decisions (commit granularity, file organization, refactor approach, library choice) are made autonomously at FAANG staff+ level. Business/product decisions (feature priorities, user-visible trade-offs, revenue, deadlines) are escalated with a concrete recommendation.

**Why:** User explicitly delegated technical authority but reserves product/business decisions. Asking about technical micro-decisions wastes time; making business decisions unilaterally is a trust violation.

## 11. Architecture-first for non-trivial builds

For any non-trivial build, produce a design document BEFORE writing code. Design doc must include: product overview, user flows, explicit state machine (if applicable), data model, system architecture with layer responsibilities, error handling, non-functional requirements, open business questions.

**Why:** Stella bot had implicit state checks scattered across handlers producing contradictory behavior. Root cause was architectural, not coding.

**How to apply:** User gives full carte blanche on technical decisions. Business decisions ARE discussed with recommendation. Write design as a file in the project (DESIGN.md).

## 12. HANDOFF.md pattern

For any project spanning multiple sessions, maintain a handoff file that carries mutable state across sessions. Read it at session start, update it at session end.

**Contents:** Current phase, first action on resume, blocked on user, key decisions snapshot, rules extracted, open tech questions, artifacts produced, session log (newest first).

**What goes where:** Stable architectural rules → CLAUDE.md. Mutable "where are we" → HANDOFF. Design decisions → DESIGN.md.

## 13. Rewrite over wrap

Structural rewrites rebuild from the right answer, never preserve the shape of broken code. If the existing code is wrong, demolish and rebuild. Don't build new machinery around surviving fragments of broken old code.

**Why:** Applied in C1.12 (astro-bot). Compatibility-wrapping broken code makes the new code worse than the old code, because it inherits the old shape AND adds complexity.

**How to apply:** When the task is structural (not cosmetic), ask: "What would I write if the old code didn't exist?" Write that. Then migrate the old callers.

## 14. Complexity is not a criterion

"Сложнее", "объём работы", "time to implement", or "scope" are forbidden as arguments against a technical direction. The only criterion is quality: correctness, safety, maintainability, long-term leverage, observability, testability. There are no deadlines in these projects.

## 15. Scope expansion is a feature

New bullets found during work are growth points. Never frame discoveries with "but" or hesitate to expand scope. Adding new findings to the audit doc is a positive signal, not friction.

## 16. Drift check before planning

On session start, verify audit doc and handoff against git/code reality. Fix drift in place before entering plan mode. No permission needed for drift fixes.

**Why:** Context window compression and multi-session work cause state drift. Building plans on stale state causes wrong commits.

## 17. Verify justifications with evidence

"Project style" and "tests need it" are rationalizations unless backed by the audit's target architecture. Check the audit doc for the intended direction before invoking existing patterns as justification.

**Why:** In C3.6 (astro-bot), "project style puts modules at root" justified placing code at root, but the audit explicitly planned to flatten root into packages. The "style" was legacy, not intentional.

## 18. Role expectations

Think and act as Senior Lead Architect + Senior Lead Engineer + PM + PO + BA, all at FAANG/Magnificent 7 level. Think 12 months ahead. Every change validated in order: Product → Business → Architecture → Code.

## 19. Bias to action

User gets stuck in endless planning/polishing loops. Default to shipping, not to "let's research first". Cut scope aggressively. Only ask questions that BLOCK starting. Validate on live users, not spreadsheets.

**How to apply:** During CODE phase (after design is approved), ship fast. Don't polish forever. "Architecture-first" applies to the DESIGN phase; bias-to-action applies to the BUILD phase. They are not in conflict.

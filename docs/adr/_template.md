# NNNN. Short noun phrase describing the decision

- **Status:** see "Status vocabulary" below
- **Date:** YYYY-MM-DD
- **Deciders:** names or roles
- **Tags:** `topic-1`, `topic-2`

## Status vocabulary

Pick the value that captures the actual lifecycle state. The plain four (`Proposed`, `Accepted`, `Deprecated`, `Superseded by ADR-NNNN`) are the default, but the corpus uses richer parenthetical qualifiers when the decision is locked in yet carries acknowledged trade-offs. Prefer the qualified form over a silent `Accepted` when any of the below applies — the parenthetical encodes honesty that bare `Accepted` loses.

- `Proposed` — drafted, not yet locked in. The decision is still negotiable.
- `Accepted` — adopted as the current rule. No known gaps, no open trade-offs.
- `Accepted (with known gaps — see Consequences)` — adopted, but the Consequences section enumerates specific gaps the team accepts.
- `Accepted (under review — see Consequences and audit X.Y)` — adopted but flagged for re-evaluation; cite the audit or trigger that will force the review.
- `Accepted (tech debt — planned for consolidation; see Consequences)` — adopted as an interim, with an explicit consolidation plan. Use when the same decision will be re-litigated once a precondition lands.
- `Accepted (with known weakness — see Consequences)` — adopted with one concrete weakness called out (security, perf, ergonomics).
- `Accepted (interim — vendor pending)` — adopted while a vendor / external dependency is provisional; the decision flips when the vendor is final.
- `Accepted (retroactive — the decision exists in the schema/code, not yet documented before this ADR)` — adopted by archeology; the ADR is catching up to reality.
- `Partially superseded by ADR-NNNN (scope qualifier — what is and is not superseded)` — replacement is partial; the qualifier states which parts of the original decision still apply.
- `Superseded by ADR-NNNN` — fully replaced. Keep the ADR file for history; link the successor.
- `Deprecated` — no longer in force, no successor. Used when the underlying problem went away rather than a new decision replacing it.

When in doubt: prefer the longer form. A reader six months from now will thank you for "Accepted (under review — Q2 perf re-evaluation)" over a bare "Accepted" that hides the open question.

## Context

What is the problem? What forces are at play? Why did this question come up now?

Write this section so a reader two years from now, with no project context, understands what was being decided and why it mattered. Include the constraints you were operating under, the signals you were reading, and the scope of the decision (what it touches, what it leaves alone).

Avoid jumping straight to the answer. The context is the most valuable part of this document when someone later asks "why not the other way?".

## Decision

The answer. One to three paragraphs. Active voice, present tense.

> We use X. It is configured through Y. It lives in Z.

State the decision cleanly, without hedging. If the decision has sub-parts, list them. If it has an intentional scope boundary ("this decision covers A, but not B"), say so explicitly.

## Consequences

What follows from this decision — both the good and the bad, both the expected and the second-order.

- **Positive:** what we gain. Be specific. "Faster builds" is weak; "CI type-check drops from 90s to 12s" is useful.
- **Negative:** what we give up. Every decision closes doors. Name them.
- **Neutral:** downstream changes that are not strictly good or bad but that future contributors need to know. Examples: new files need to live in directory X, tests now require Postgres running, the deploy pipeline must set env var Y.

## Alternatives considered

What else did we look at? For each alternative, state:

- What it was.
- Why it was reasonable to consider.
- Why we rejected it.

This section is gold in year two. Write it honestly — if an alternative was close, say it was close. Future contributors will re-litigate this decision eventually; they deserve the same information we had.

## References

- Links to issues, RFCs, external articles, benchmarks, or prior ADRs.
- If the decision depends on or conflicts with another ADR, link it explicitly.

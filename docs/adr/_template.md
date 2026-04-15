# NNNN. Short noun phrase describing the decision

- **Status:** Proposed | Accepted | Deprecated | Superseded by ADR-NNNN
- **Date:** YYYY-MM-DD
- **Deciders:** names or roles
- **Tags:** `topic-1`, `topic-2`

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

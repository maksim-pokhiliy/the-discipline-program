# Architecture Decision Records

This directory holds the project's Architecture Decision Records (ADRs). Every non-trivial architectural choice — why we picked technology X, why bounded context Y lives where it does, why we traded off A for B — lives here, next to the code it describes.

## Why ADRs

A codebase grows faster than anyone can remember it. Six months after a decision, the only person who knows the trade-offs is the one who made it — and they have already moved on to the next problem. New contributors see the result and treat it as fact. Wrong decisions calcify because nobody remembers they were decisions.

ADRs fix this. Each record captures:

- **What** we decided.
- **Why** we decided it (the alternatives we considered, the constraints, the trade-offs).
- **When** we decided it (date + superseded-by links when it changes).
- **What follows** from it (consequences, both positive and negative).

The value is not in the document. The value is in the forced thinking and the durable record.

## Format

We use a slightly trimmed version of the [Michael Nygard ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions.html):

- **Title** — short noun phrase describing the decision.
- **Status** — Proposed / Accepted / Deprecated / Superseded by ADR-NNNN.
- **Date** — ISO date (`2026-04-10`).
- **Context** — the forces at play, the problem to solve. Written so that a future reader with no project context can understand why the question even came up.
- **Decision** — the answer. Active voice, present tense: "we use X", not "we will use X".
- **Consequences** — what follows from the decision. Positive, negative, and neutral. Include things like "this makes Y harder", not only the upside.
- **Alternatives considered** — what else we looked at and why we rejected it. This is the most valuable section in year two, when someone asks "why not Z?".

See `_template.md` for the skeleton to copy.

## Naming and numbering

- Files are named `NNNN-short-kebab-title.md` where `NNNN` is a zero-padded sequential number.
- Numbers are assigned at the moment of merge, not at draft time, to avoid collisions across branches. If two ADRs land with the same number, the second-merged one is renamed.
- Never renumber existing ADRs. If an ADR is wrong, write a new one that supersedes it — do not edit history.

## Lifecycle

1. **Proposed** — draft pushed as part of a PR. Discussion happens on the PR.
2. **Accepted** — merged to main. The decision is now load-bearing. Code may reference it.
3. **Deprecated** — no longer applies, but not replaced. Left for historical context.
4. **Superseded by ADR-NNNN** — replaced by a newer decision. The new ADR links back; the old one links forward.

An accepted ADR is never deleted. Superseded records stay in the tree so that git history and code comments keep resolving.

## When to write one

Write an ADR when the answer to "why is it this way?" would not be obvious from reading the code. Concretely:

- Choosing between two or more comparable technologies or libraries.
- Drawing a boundary between bounded contexts or packages.
- Accepting a non-obvious trade-off (performance vs correctness, cost vs flexibility, speed vs generality).
- Codifying an invariant that lives in more than one place in the code.
- Introducing a constraint that future contributors will want to break (e.g., "no direct Prisma imports outside api-server").

Do **not** write an ADR for:

- Code style and formatting (that is for `CLAUDE.md` and ESLint).
- Library version bumps.
- Bug fixes.
- Anything fully recoverable from `git log` and the current file contents.

## Index

Current records live in this directory. For a high-level summary of every accepted ADR, run:

```bash
ls docs/adr/*.md | xargs -I{} sh -c 'grep -H "^# " {} | head -1'
```

(An auto-generated index is out of scope for now; the file listing is enough at this size.)

# How we work — the process

> The team-of-one-plus-AI workflow. Big teams run roadmap → epics → tickets → PRs → review → release; we run the same shape with fewer ceremonies and durable files instead of a ticket tracker. This doc is the canonical description of that shape. The thing it most exists to enforce: **work isn't done until it's committed, green, and promoted to its durable home** — the discipline whose absence already lost a roadmap.

---

## The planning stack (top to bottom)

| Layer          | What it is                                                          | Lives in                                  | Big-team analogue       |
| -------------- | ------------------------------------------------------------------- | ----------------------------------------- | ----------------------- |
| **Roadmap**    | Phases from now to MVP launch; the fixed bar                        | `docs/roadmap.md`                         | Product roadmap / OKRs  |
| **Initiative** | One epic — usually one phase or a big feature                       | `initiatives/<slug>/`                     | Epic / project          |
| **Wave**       | An appetite-boxed slice of an initiative (W1, W2…)                  | `initiatives/<slug>/plan.md` + `state.md` | Sprint / Shape-Up cycle |
| **Build**      | One executable unit of a wave                                       | a `/feature` (or `/fix`) run on a branch  | Ticket → PR             |
| **Decision**   | A ratified "why" (step-level → `decisions.md`; cross-cutting → ADR) | `decisions.md` · `docs/adr/`              | ADR / design doc        |

Read top-down at the **start of every session**: roadmap (where are we) → active initiative's `state.md` board (what's next) → the wave. `/initiative-resume` does this.

## The lifecycle of a build

The progressive-refinement pipeline, mapped to our skills (prior art: the `/prd → /specs → /plan → /orchestrator → /qa → /ship` pattern and Superpowers' TDD-before-merge — borrowed, not imported):

```
understand → design → plan → build → review → close out
 research     decisions   plan.md   /feature   git-diff   promote to docs
 + spec       (+ ADR)     + prompt   pipeline   review     + close-out
```

- **Understand / design** happen WITH the owner (the planner reads sources, never instinct-specs; quotes the source of truth). Open questions are ratified before they gate execution.
- **Plan** = a self-contained runner prompt (the runner session has none of the design context).
- **Build** = a `/feature` (full or `small`) run, ≤1 full per session. Aggressive, bridge-free migrations in the `db:reset` world — only the final pushed state must be green.
- **Review** = the orchestrator reads the **git diff**, never the agent's self-report (long runs over-report). UI / drag-and-drop / pointer layers are reviewed in a **browser walkthrough** — jsdom cannot see them.
- **Close out** = promote every ratified decision and carry-forward into the durable docs, in the SAME PR.

## The build loop — the standing three-role standard (ratified 2026-07-27)

The team is ALWAYS the same trio: **tech lead** (Claude, the planning session) · **owner** (Maksim) · **executor(s)** (fresh `/feature` / `/fix` sessions). **The tech lead decides the order of work** — and how many executors run at once: 2+ in parallel is fine when the work calls for it (disjoint zones); it's a per-queue call, not a rule. Per work item, in order, no skipping:

1. **Pick.** Owner + tech lead settle WHAT is next (the tech lead orders the queue).
2. **Corpus.** The tech lead writes the corpus — HOW the item will be executed through an executor: approach, scope cut, constraints, risks — into the initiative docs. The owner reads it; discussion if needed. No prompt before the corpus is read.
3. **Prompt.** The tech lead writes the executor prompt (a self-contained `/feature`/`/fix` brief, checked into the initiative dir). The owner transports it to the executor session. **The prompt is INPUT to the executor's skill — evidence, ratified constraints, scope boundaries, acceptance. It must NEVER override, forbid, or replace the skill's own pipeline stages, gates, task tracking, or artifacts: every skill runs by its original instructions.** Prior recon is framed as "verify, then use — a head start for the investigation", never as "do not re-derive". (Ratified 2026-07-27 after an executor, given a plan-shaped prompt, skipped the pipeline and worked bare-handed.)
4. **Gate A.** The executor's Gate A comes back to the tech lead via the owner. Verdict ok / not-ok; a not-ok produces a feedback prompt the owner carries back to the SAME executor. Loop until ok.
5. **PR.** The executor drives to a pull request. The owner brings the PR to the tech lead; the tech lead reviews the **git diff** (never the self-report).
6. **Browser pass.** If anything is user-visible, the tech lead writes a SHORT browser-test scenario (a flat checklist); the owner runs it.
7. **Merge.** Only after BOTH oks — tech lead (diff) AND owner (browser/product) — the PR merges. Then the close-out promotion as usual.

Role duties, spelled out:

- **Tech lead** (planning session): triage/research, corpora, executor prompts, Gate-A verdicts + feedback prompts, PR diff review, browser scenarios, queue order, board upkeep.
- **Executor** (fresh session): executes ONE prompt to a PR; never self-expands scope; out-of-scope findings go to `deferred.md` as notes.
- **Owner** (Maksim): reads corpora, ratifies decisions, transports prompts/gates/PRs between sessions, runs browser scenarios, merges.

_(Supersedes the D-7 orchestrator/runner naming — same trio, now with the explicit corpus stage and the two-ok merge gate.)_

## Definition of Done — the discipline

A unit of work is DONE only when ALL of these hold. This is the gate that protects against the roadmap-loss class of failure:

1. **Committed.** Nothing load-bearing lives only in memory, an agent's scratch (`.feature-dev/`, gitignored), or a chat transcript. If it matters, it's in a tracked file. _(The 7-phase roadmap was rewritten, agreed, and never committed — so it evaporated. Never again.)_
2. **Green.** Pre-commit gates pass without bypass — `husky` + `commitlint` + `check-types` + `lint`; tests per the project's gating rules. No `--no-verify`, no skip flags; a failing hook means fix the root cause.
3. **Promoted.** Decisions → `decisions.md`/ADR; carry-forwards → `deferred.md`; narrative → `journal.md`; the board → `state.md`. Distil at every gate — don't let the durable docs drift behind the work.
4. **Verified for real.** Code: the relevant suite green on a reseeded DB. UI: an owner walkthrough. "Self-report says green" is not verification.

## Cadence (lightweight ceremonies)

- **Session start** — read the stack top-down (`/initiative-resume`). The roadmap is the first thing read, every time.
- **Gate review** — between waves, the orchestrator reviews the diff and the owner walks the UI; carry-forwards are promoted before the next wave starts.
- **Close-out** — at the end of any session that touched an initiative (`/initiative-close`): promote, update the board + journal + plan, one docs commit.
- **Appetite, not estimate** — a wave is sized by how much the change is _worth_, not predicted to take; if it overruns the appetite, re-scope rather than let it sprawl.

## Gates (the hard stops)

- **Pre-commit:** husky + lint-staged + commitlint (lowercase subject, no AI trailers, no `--no-verify`).
- **Pre-push / CI cone:** `dep:check` + `lint` + `check-types`. The api-server suite is a gated MANUAL run (~10 min, live Neon) — never auto-run.
- **Spec-freeze gate:** an initiative's design freezes only when its grid/ledger has zero OPEN rows (e.g. `primitive-spec.md`).
- **Owner walkthrough:** the gate for any UI/UX or interaction-layer change — the suite being green means nothing for the pointer/collision layer.

## What we deliberately DON'T do

There are a million PM frameworks; we don't import one whole. We borrow the **appetite-boxed cycle** (Shape Up) and the **progressive-refinement pipeline** (problem → spec → plan → build → review → ship), and skip the rest. Specifically NOT:

- **No GitHub Issues board / sprint ceremonies.** Solo + AI: the durable docs (`state.md` board, `deferred.md` ledger) ARE the tracker — lighter, versioned, and read by the agent each session. (Tools like `ccpm` use GitHub Issues + worktrees for parallel agents; we're not at that scale.)
- **No estimates / velocity / story points.** Appetite + "is it the next thing on the roadmap" is the whole prioritization.
- **No standups / retro ritual.** The `journal.md` append-only log is the retro trail; close-out is the retro.

## Cross-references

`docs/roadmap.md` (the top) · `initiatives/README.md` (initiative mechanics) · `docs/adr/README.md` (decision records) · `docs/planner-discipline.md` (read/verify-then-spec checklists). The skills that drive builds: `/feature`, `/fix`, `/audit`, `/initiative-resume`, `/initiative-close`.

# 0001. Use Architecture Decision Records for non-trivial architectural choices

- **Status:** Accepted
- **Date:** 2026-04-10
- **Tags:** `process`, `documentation`, `governance`

## Context

The project is a high-performance coaching platform combining a marketing CMS, an LMS, and a billing subsystem — three distinct domains in one monorepo. It carries several load-bearing architectural choices that were made implicitly, without durable written justification:

- A monorepo built on Turbo, not Nx or Rush.
- Prisma as the ORM, not Drizzle or Kysely.
- NextAuth v4 with a credentials provider only, not OAuth or a managed auth vendor.
- MUI as the design system, not shadcn or Mantine.
- Vercel Blob as the storage layer, directly imported in `api-server` endpoints.
- A singleton-subscription invariant, enforced at the database level.
- A soft-delete Prisma extension that covers some query methods and not others.
- A BFF-via-HTTP-loopback pattern where server components call their own API through `fetch(NEXT_PUBLIC_APP_URL)`.
- Two independent NextAuth instances (admin and platform apps), each building its own `authOptions`.
- A JWT session strategy with a 30-day max age.
- Stripe as the future payment provider, visible only through `stripeProductId` and `stripePriceId` columns in the Prisma schema.

None of these decisions are documented anywhere a future contributor can find them. The reasoning lives in one person's head, or in a Slack thread that has already aged out. Six months from now the only signal that a decision was ever made will be the code itself — and code looks like fact, not like a choice someone argued their way into.

This is fragile. When the next developer sees `Subscription.id String @id` (no default), they will not know that the field holds a Stripe subscription ID. They will assume it is a bug and "fix" it. When someone proposes replacing MUI with shadcn, nobody will remember why MUI was picked, so the discussion will run on vibes instead of on the original trade-offs. When the billing layer finally goes in, the `stripeProductId` hint will be discovered late or missed entirely, and the team will debate a provider choice that has already been made at the database layer.

The cost of fixing this is small and one-time. The cost of not fixing it compounds as the project grows.

## Decision

We adopt Architecture Decision Records (ADRs) as the durable record of non-trivial architectural choices. ADRs live in `docs/adr/`, follow the Michael Nygard format (with the sections described in `docs/adr/README.md`), and are written as part of the change that introduces or codifies the decision.

An ADR is required when:

1. We pick one technology or library over comparable alternatives.
2. We draw a boundary between bounded contexts, packages, or deploy units.
3. We accept a non-obvious trade-off (performance vs correctness, cost vs flexibility, lock-in vs speed).
4. We codify an invariant that touches more than one layer of the stack.
5. We introduce a constraint that future contributors will reasonably want to break.

An ADR is **not** required for code style, formatting, version bumps, bug fixes, or anything trivially recoverable from `git log`.

ADRs are numbered sequentially, never renumbered, and never deleted. A wrong decision is replaced with a new ADR that supersedes the old one; both remain in the tree.

Existing implicit decisions — the ones listed in the Context section — are backfilled as ADRs 0002 through 0012 as a separate bulk commit, so that the historical record is complete before the project starts accumulating new decisions on top of an undocumented foundation.

## Consequences

**Positive:**

- New contributors can answer "why is it this way?" without interrupting senior engineers.
- Future architectural reviews (including the Big Tech audit this repository is currently undergoing) have a concrete artifact to reference, not a reconstruction from code.
- Decisions that turn out to be wrong are visible as wrong, not invisible as drift.
- The act of writing an ADR forces the author to articulate the alternatives they considered, which catches sloppy reasoning before it lands.
- Long-lived constraints (for example, "no direct Prisma imports outside `api-server`") have a home that explains why they exist, so dependency-cruiser rules and ESLint checks are not opaque.

**Negative:**

- Every architecturally significant PR carries an additional deliverable. A small tax on every change that crosses the bar.
- ADRs must be maintained: a decision that changes without a corresponding new ADR is worse than having no ADR at all, because it poisons the record. Requires discipline.
- The bar for "when to write one" is judgment, not a rule. Some decisions will be under-documented and some over-documented until the team calibrates.

**Neutral:**

- The `docs/adr/` directory grows over time. File listing stays manageable at this size; an auto-generated index can be added later if the tree crosses ~50 records.
- ADR numbering is assigned at merge time, not at draft time, to avoid collisions across parallel branches.
- This ADR itself is 0001 — the meta-decision about using ADRs is the first ADR, so the record format is self-bootstrapping.

## Alternatives considered

**No written records (status quo).** The option we are rejecting. Cheap in the short term, expensive in the long term, already starting to hurt.

**Inline code comments explaining decisions.** Comments decay — they drift away from the code they describe, they get stripped by reformatters, they become lies. Comments are also invisible to anyone browsing the repo's history. Rejected: poor durability, poor discoverability, conflicts with the project rule "no comments in code".

**A single `ARCHITECTURE.md` document.** Simpler on day one, but it grows into a wiki nobody reads. A single document has no granularity, so individual decisions cannot be superseded independently. The project already had a `docs/ARCHITECTURE.md` that went stale within six months and was deleted as actively misleading — that is the exact failure mode we are avoiding. Rejected.

**A Notion or Confluence wiki.** Separates the record from the code, which means the record rots the moment git history and wiki history diverge. Also adds an external dependency to the onboarding path. Rejected: we want the record to live in the same repo, reviewed in the same PRs, versioned with the same git.

**Structurizr or the C4 model.** More heavyweight. Valuable for visualizing systems at scale, but overkill at this size. Not mutually exclusive — a C4 diagram can sit alongside ADRs if we later need one. Deferred, not rejected.

**RFCs instead of ADRs.** RFCs are proposal documents for decisions not yet made; ADRs are records of decisions already made. We need the latter, because most of the decisions we are documenting already exist in the code. RFCs might be introduced later as a complementary tool for genuinely forward-looking proposals, but they do not replace ADRs.

## References

- Michael Nygard, "Documenting Architecture Decisions" (2011) — the original format.
- `docs/adr/README.md` — lifecycle, numbering, and authoring guidance for this repository.
- `docs/adr/_template.md` — the skeleton to copy when writing a new ADR.
- `docs/BIGTECH-AUDIT.md` — the audit that triggered this ADR framework.

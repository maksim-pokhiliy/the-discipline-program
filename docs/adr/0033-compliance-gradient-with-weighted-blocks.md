# 0033. Compliance gradient with weighted blocks

- **Status:** Proposed
- **Date:** 2026-04-26
- **Tags:** `lms`, `analytics`

## Context

A binary "did the workout / didn't do the workout" compliance signal loses too much. A real day's training has structure — warm-up, strength, metcon, cool-down — and an athlete who did warm-up plus strength but skipped the metcon has not "missed the workout"; they have done part of it, and the part they skipped is the most important part of the day. The dashboard cannot help a coach intervene if everything below 100% reads as zero, and the dashboard cannot reward consistency if everything above 0% reads as one.

The legacy `WorkoutLog.isRx Boolean` carries even less information than binary compliance — it conflates "did the workout" with "did it as prescribed". An RX run of warm-up only, with no metcon, currently registers as "rx = true". The signal is wrong in both directions.

We need a richer gradient. The gradient must be cheap to compute, easy for coaches to interpret, and configurable enough that the head coach can tune what "completed" means for a particular gym's culture.

## Decision

Each `Block` carries a `weight: Int` (default 1, copied at block creation from the parent `BlockKind.defaultWeight`, with per-block override allowed). The weight is the relative importance of completing that block. By default — set in the SYSTEM seed — METCON blocks have weight 3, STRENGTH have weight 2, WARM_UP and COOL_DOWN have weight 1, ACCESSORY/SKILL/CORE have weight 1.

A `WorkoutSession` carries a derived `completionRatio: Decimal(3,2)` in `[0.00, 1.00]`, computed at completion time as:

```
completionRatio = Σ weight(block) for blocks where blockSession.status = COMPLETED
                / Σ weight(block) for all blocks scheduled in that day
```

The dashboard does not display the raw ratio. It buckets sessions into three categories with thresholds that live in `SystemSettings.complianceThresholds`:

- **Fully completed** — `completionRatio ≥ 0.9`
- **Partially completed** — `0.3 ≤ completionRatio < 0.9`
- **Missed** — `completionRatio < 0.3` (or no session at all for that day)

Defaults `0.9` and `0.3` are seeded; the head coach can adjust them per gym in admin settings.

The ratio is recomputed by `weekly-volume-aggregator` (ADR-0028 service) at session completion and during the nightly recompute pass. The CHECK constraint `chk_completion_ratio_range` enforces the `[0,1]` range at the DB level (see `prisma/sql/lms-checks.sql`).

## Consequences

**Positive:**

- The dashboard shows three buckets, not one number. A coach sees that an athlete is doing warm-ups but skipping metcons (lots of "partial", few "full") and intervenes.
- Weighting is configurable via `BlockKind.defaultWeight` plus per-block override. A gym that values skill work highly can raise the SKILL weight; a gym that runs heavy strength cycles can raise STRENGTH.
- Thresholds are gym-tunable. A high-volume gym may set "full" at 0.95; a beginner-heavy gym may set "partial" at 0.2.
- The metric extends naturally — adding "RX vs scaled" or "intensity adherence" later does not require breaking the existing buckets, just adding new dimensions.

**Negative:**

- Coaches who want a single number have to learn the bucket model. Mitigated: the dashboard exposes both the bucket and the underlying ratio when drilled into.
- `BlockKind.defaultWeight` is mutable; changing it after sessions exist does not retroactively recompute completion ratios. We accept this — historical analytics reflect the weights that were in effect at completion. A future ADR could introduce snapshot-of-weight on `BlockSession` if this becomes a concern.
- Three buckets is an opinion. Other shops use four (full / mostly / partial / missed) or two (full / not full). Mitigated: thresholds are configurable; a four-bucket variant is a UI change, not a schema change.

**Neutral:**

- The decimal precision `Decimal(3,2)` is enough for the bucketing logic. We are not measuring at the third decimal place.
- Reporting that aggregates buckets across athletes (e.g., "what fraction of last week's prescribed metcons were fully completed across the team") rolls up cleanly via the `WeeklyVolume` denormalized rows.

## Alternatives considered

**Binary compliance (status quo).** Rejected: discussed in Context. The signal is wrong in both directions and offers no diagnostic value.

**Continuous score, no bucketing.** Display the raw 0..1 ratio everywhere. Rejected: a continuous metric is worse for triage than bucketed categories. A coach scanning 30 athletes wants to see "5 missed yesterday", not "athlete 1: 0.31, athlete 2: 0.48, athlete 3: 0.12, …".

**Weighted blocks but no thresholds (single ratio bucketed at fixed cutoffs).** Rejected: gyms differ in what they call "complete". Hardcoding thresholds locks the metric to one gym's culture. The configurability is cheap (one settings row) and meaningfully useful.

**Per-athlete completion targets (each athlete gets a target ratio).** Rejected: too granular for the value it adds. The head coach tuning gym-level thresholds covers most of the variance; per-athlete targets are a 90th-percentile feature that can be added later without breaking this model.

## References

- `docs/design/workout-redesign.md` §6.2 (compliance gradient definition).
- ADR-0028 — service layer (the aggregator that maintains the ratio).
- ADR-0027 — the block/session model these computations run on.

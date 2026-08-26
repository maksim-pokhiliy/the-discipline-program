import type {
  BackfillAction,
  BackfillConflict,
  BackfillPlan,
  BackfillWarning,
} from "./legacy-days-backfill-plan";
import { describeDay } from "./legacy-days-backfill-plan";
import { shortPlanDigest } from "./script-target-guard";

export type CanonicalBackfillPlan = {
  actions: readonly string[];
  conflicts: readonly string[];
  warnings: readonly string[];
};

const canonicalAction = (action: BackfillAction): string =>
  `${action.kind}|${describeDay(action.target)}|${String(action.target.legacyRowId)}>` +
  `${String(action.content.legacyRowId)}|${action.contentHash}`;

const canonicalConflict = (conflict: BackfillConflict): string =>
  `${conflict.subject}|${conflict.reason}|${conflict.detail}`;

const canonicalWarning = (warning: BackfillWarning): string =>
  `${warning.subject}|${warning.kind}|${warning.detail}`;

export const canonicalizeBackfillPlan = (plan: BackfillPlan): CanonicalBackfillPlan => ({
  actions: plan.actions.map(canonicalAction).sort(),
  conflicts: plan.conflicts.map(canonicalConflict).sort(),
  warnings: plan.warnings.map(canonicalWarning).sort(),
});

export const backfillDigest = (plan: BackfillPlan): string =>
  shortPlanDigest(canonicalizeBackfillPlan(plan));

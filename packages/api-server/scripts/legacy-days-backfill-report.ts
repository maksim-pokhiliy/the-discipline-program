import { backfillDigest } from "./legacy-days-backfill-digest";
import {
  type BackfillAction,
  type BackfillActionKind,
  type BackfillConflict,
  type BackfillConflictReason,
  type BackfillPlan,
  type BackfillWarning,
  type BackfillWarningKind,
  describeDay,
} from "./legacy-days-backfill-plan";
import { EXPECT_PLAN_FLAG } from "./script-target-guard";

export type BackfillReportMode = "dry-run" | "applied" | "refused" | "stale-plan";

const HEADERS = {
  "dry-run": "legacy days backfill — DRY RUN, nothing was written",
  applied: "legacy days backfill — APPLIED",
  refused: "legacy days backfill — REFUSED, nothing was written",
  "stale-plan": "legacy days backfill — REFUSED, the plan changed since the digest you pinned",
} satisfies Record<BackfillReportMode, string>;

const ACTION_HEADINGS = {
  fill: "FILL",
  "fill-from-newer-row": "FILL FROM A NEWER LEGACY ROW",
} satisfies Record<BackfillActionKind, string>;

const CONFLICT_LABELS = {
  "link-missing-channel-id": "publish link carries no legacy id for its channel",
  "duplicate-legacy-row": "several legacy rows sit on one day",
  "rest-day-carries-a-program": "export row is a rest day carrying a program",
  "training-day-carries-no-program": "export row is a training day carrying no program",
  "program-body-is-not-the-wire-shape": "export row's program is not the shape the app is served",
  "program-body-carries-fields-we-would-drop": "export row's program carries fields we would drop",
  "duplicate-legacy-row-id": "duplicate row id in the export",
} satisfies Record<BackfillConflictReason, string>;

const WARNING_LABELS = {
  "missing-in-legacy": "no legacy day to fill this one from",
} satisfies Record<BackfillWarningKind, string>;

const section = (heading: string, lines: readonly string[]): readonly string[] =>
  lines.length === 0 ? [] : ["", heading, ...lines.map((line) => `  ${line}`)];

const byKind = (plan: BackfillPlan, kind: BackfillActionKind): BackfillAction[] =>
  plan.actions.filter((action) => action.kind === kind);

const describeAction = (action: BackfillAction): string =>
  `${describeDay(action.target)}  plan "${action.target.planName}"  ` +
  `legacy row ${String(action.target.legacyRowId)}` +
  (action.kind === "fill" ? "" : ` -> ${String(action.content.legacyRowId)}`) +
  `  ${action.content.isRestDay ? "rest day" : "training day"}`;

const onPlan = (planName: string | null): string =>
  planName === null ? "" : `  plan "${planName}"`;

const describeConflict = (conflict: BackfillConflict): string =>
  `${conflict.subject}${onPlan(conflict.planName)}  ${CONFLICT_LABELS[conflict.reason]}: ` +
  conflict.detail;

const describeWarning = (warning: BackfillWarning): string =>
  `${warning.subject}${onPlan(warning.planName)}  ${WARNING_LABELS[warning.kind]}: ` +
  warning.detail;

const summaryLine = (plan: BackfillPlan): string =>
  `fill ${String(byKind(plan, "fill").length)} · ` +
  `fill-from-newer-row ${String(byKind(plan, "fill-from-newer-row").length)} · ` +
  `missing-in-legacy ${String(plan.warnings.length)} · ` +
  `already-filled (skipped) ${String(plan.alreadyFilled)} · ` +
  `conflicts ${String(plan.conflicts.length)}`;

const digestLine = (plan: BackfillPlan, mode: BackfillReportMode): string => {
  const digest = backfillDigest(plan);

  if (mode === "applied") {
    return `plan digest ${digest}`;
  }

  return plan.conflicts.length > 0
    ? `plan digest ${digest} — do not pin this one; resolve the conflicts below, re-run the dry ` +
        "run, and pin the digest that one prints"
    : `plan digest ${digest} — pin it on the apply with ${EXPECT_PLAN_FLAG}${digest}`;
};

const verdictLines = (plan: BackfillPlan, mode: BackfillReportMode): readonly string[] => {
  if (mode === "stale-plan") {
    return [
      "",
      "REFUSED: nothing was written. The plan above is what this database and this export would " +
        "produce now, and it is not the plan whose digest was pinned.",
      "Read it as you read the first one, and re-run the apply with the digest printed above.",
    ];
  }

  if (plan.conflicts.length > 0) {
    return [
      "",
      mode === "dry-run"
        ? "REFUSED: this export would not be applied while any conflict above stands."
        : "REFUSED: nothing was written. Every conflict above has to be resolved first.",
      "A conflict is either a contradiction inside the export or a publish link that cannot be " +
        "matched. Neither is something a backfill may resolve by choosing.",
    ];
  }

  return [
    "",
    mode === "applied"
      ? "APPLIED: every day above was filled in one transaction."
      : "CLEAN: re-run with --write --expect-host=<hostname> and the plan digest above to apply. " +
        "Take that hostname from your own record of the database you meant, never from this report.",
  ];
};

export const renderBackfillReport = (
  plan: BackfillPlan,
  mode: BackfillReportMode,
): readonly string[] => [
  HEADERS[mode],
  summaryLine(plan),
  digestLine(plan, mode),
  ...section(ACTION_HEADINGS.fill, byKind(plan, "fill").map(describeAction)),
  ...section(
    ACTION_HEADINGS["fill-from-newer-row"],
    byKind(plan, "fill-from-newer-row").map(describeAction),
  ),
  ...section("MISSING IN LEGACY", plan.warnings.map(describeWarning)),
  ...section("CONFLICTS", plan.conflicts.map(describeConflict)),
  ...verdictLines(plan, mode),
];

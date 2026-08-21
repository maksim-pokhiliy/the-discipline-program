import { planDigest } from "./legacy-users-import-digest";
import type {
  ConflictReason,
  CredentialOutcome,
  ImportAction,
  ImportPlan,
  ImportWarning,
  WarningKind,
} from "./legacy-users-import-plan";
import { EXPECT_PLAN_FLAG } from "./script-target-guard";

export type ReportMode = "dry-run" | "applied" | "refused" | "stale-plan";

const HEADERS = {
  "dry-run": "legacy users import — DRY RUN, nothing was written",
  applied: "legacy users import — APPLIED",
  refused: "legacy users import — REFUSED, nothing was written",
  "stale-plan": "legacy users import — REFUSED, the plan changed since the digest you pinned",
} satisfies Record<ReportMode, string>;

export const ADDRESS_CHANGE_HEADING = "ACTION REQUIRED — login address changes";

const CONFLICT_LABELS = {
  "username-not-an-email": "username is not an email",
  "override-source-mismatch": "ratified override no longer matches the source row",
  "duplicate-email-in-source": "duplicate address in the export",
  "duplicate-legacy-id-in-source": "duplicate legacy id in the export",
  "catalog-id-out-of-range": "legacy catalog id out of range",
  "link-and-email-disagree": "publish link and address name different users",
  "ambiguous-link": "several publish links name different athletes",
  "matched-user-soft-deleted": "matched platform user is soft-deleted",
  "matched-user-has-other-identity": "matched platform user already carries another legacy id",
  "platform-user-claimed-twice": "two legacy rows claim one platform user",
  "identity-user-missing": "the named platform user no longer exists",
  "link-and-identity-disagree": "publish link and stored identity name different users",
} satisfies Record<ConflictReason, string>;

const WARNING_LABELS = {
  "login-address-changes": "app login address changes",
  "matched-user-is-not-an-athlete": "matched platform user is not an athlete",
  "password-left-as-is":
    "stored credential is not the one the import wrote; legacy hash not written",
  "identity-absent-from-source": "stored identity missing from this export",
  "identity-target-drift": "the legacy address now belongs to a different platform user",
  "synthetic-email-no-credential": "synthetic address, no usable credential",
  "matched-user-has-no-credential": "matched platform user has no password of their own",
  "credential-differs-not-restored": "credential differs from the export and was NOT replaced",
  "credential-restored": "stored credential REPLACED by the export hash",
  "legacy-team-dropped": "legacy team has nowhere to go",
} satisfies Record<WarningKind, string>;

const tag = (legacyUserId: number): string => `[${String(legacyUserId).padStart(6, " ")}]`;

const describeCreate = (action: Extract<ImportAction, { kind: "create" }>): string => {
  const { row } = action;
  const credential = row.passwordHash === null ? "no credential" : "legacy credential";

  return (
    `${tag(row.legacyUserId)} ${row.email}  role ${row.legacyRoleId} plan ${row.legacyPlanId} ` +
    `level ${row.legacyLevelId}  ${row.isEnabled ? "enabled" : "disabled"}  ${credential}`
  );
};

const describeAttach = (action: Extract<ImportAction, { kind: "attach" }>): string =>
  `${tag(action.row.legacyUserId)} ${action.row.sourceUsername} -> ${action.userEmail}  via ${action.matchedBy}`;

const CREDENTIAL_NOTES = {
  restored: "; STORED CREDENTIAL REPLACED by the export hash",
  "marker-backfilled": "; the stored credential is the one this import wrote, now recorded as such",
  unchanged: "",
  "left-as-is": "",
} satisfies Record<CredentialOutcome["kind"], string>;

const describeRefresh = (action: Extract<ImportAction, { kind: "refresh" }>): string => {
  const changes =
    action.identityChanges.length === 0
      ? "no change"
      : action.identityChanges
          .map((change) => `${change.field} ${change.from} -> ${change.to}`)
          .join(", ");

  return `${tag(action.row.legacyUserId)} ${action.userEmail}  ${changes}${CREDENTIAL_NOTES[action.credentialOutcome.kind]}`;
};

const section = (heading: string, lines: readonly string[]): readonly string[] =>
  lines.length === 0 ? [] : ["", heading, ...lines.map((line) => `  ${line}`)];

const byKind = <K extends ImportAction["kind"]>(
  plan: ImportPlan,
  kind: K,
): Extract<ImportAction, { kind: K }>[] =>
  plan.actions.filter(
    (action): action is Extract<ImportAction, { kind: K }> => action.kind === kind,
  );

const describeWarning = (warning: ImportWarning): string =>
  `${tag(warning.legacyUserId)} ${WARNING_LABELS[warning.kind]}: ${warning.detail}`;

const summaryLine = (plan: ImportPlan): string => {
  const attachments = byKind(plan, "attach");
  const refreshes = byKind(plan, "refresh");
  const linkCount = attachments.filter((action) => action.matchedBy === "link").length;
  const emailCount = attachments.length - linkCount;
  const mirrorDiffs = refreshes.filter((action) => action.identityChanges.length > 0).length;
  const markersBackfilled = refreshes.filter(
    (action) => action.credentialOutcome.kind === "marker-backfilled",
  ).length;
  const addressChanges = plan.warnings.filter(
    (warning) => warning.kind === "login-address-changes",
  ).length;
  const credentialsReplaced = plan.warnings.filter(
    (warning) => warning.kind === "credential-restored",
  ).length;

  return (
    `create ${byKind(plan, "create").length} · attach ${attachments.length} ` +
    `(link ${linkCount} / address ${emailCount}) · refresh ${refreshes.length} · ` +
    `mirror diffs ${mirrorDiffs} · login-address changes ${addressChanges} · ` +
    `credentials replaced ${credentialsReplaced} · markers backfilled ${markersBackfilled} · ` +
    `conflicts ${plan.conflicts.length} · warnings ${plan.warnings.length}`
  );
};

const reconciliationLine = (plan: ImportPlan): string => {
  const { reconciliation } = plan;

  return reconciliation === null
    ? "RECONCILIATION not assessed — no row in this export could be read, so the database was " +
        "never consulted"
    : `RECONCILIATION individual links ${reconciliation.linksChecked} · ` +
        `matched to a stored identity ${reconciliation.linksWithIdentity} · ` +
        `violations ${reconciliation.violations}`;
};

const digestLine = (plan: ImportPlan, mode: ReportMode): string => {
  const digest = planDigest(plan);

  if (mode === "applied") {
    return `plan digest ${digest}`;
  }

  return plan.conflicts.length > 0
    ? `plan digest ${digest} — do not pin this one; resolve the conflicts below, re-run the dry ` +
        "run, and pin the digest that one prints"
    : `plan digest ${digest} — pin it on the apply with ${EXPECT_PLAN_FLAG}${digest}`;
};

const verdictLines = (plan: ImportPlan, mode: ReportMode): readonly string[] => {
  if (mode === "stale-plan") {
    return [
      "",
      "REFUSED: nothing was written. The plan above is what this database would produce now, and " +
        "it is not the plan whose digest was pinned.",
      "Read it as you read the first one, and re-run the apply with the digest printed above.",
    ];
  }

  if (plan.conflicts.length > 0) {
    const hasPlatformOnlyConflict = plan.conflicts.some(
      (conflict) => conflict.reason === "link-and-identity-disagree",
    );

    return [
      "",
      mode === "dry-run"
        ? "REFUSED: this export would not be applied while any conflict above stands."
        : "REFUSED: nothing was written. Every conflict above has to be resolved first.",
      "Resolve a conflict by fixing the platform row, or by removing that row from the export and re-running.",
      ...(hasPlatformOnlyConflict
        ? [
            "One above is not of that kind: a publish link and a stored identity naming different " +
              "people is computed from this database alone, so removing the row from the export " +
              "changes nothing. Retarget or delete that publish link, or move the stored identity " +
              "onto the person it belongs to, then re-run.",
          ]
        : []),
    ];
  }

  return [
    "",
    mode === "applied"
      ? "APPLIED: every action above was written in one transaction."
      : "CLEAN: re-run with --write --expect-host=<hostname> and the plan digest above to apply. " +
        "Take that hostname from your own record of the database you meant, never from this report.",
  ];
};

export const renderImportReport = (plan: ImportPlan, mode: ReportMode): readonly string[] => {
  const addressChanges = plan.warnings.filter(
    (warning) => warning.kind === "login-address-changes",
  );
  const otherWarnings = plan.warnings.filter((warning) => warning.kind !== "login-address-changes");

  return [
    HEADERS[mode],
    summaryLine(plan),
    reconciliationLine(plan),
    digestLine(plan, mode),
    ...section("CREATE", byKind(plan, "create").map(describeCreate)),
    ...section("ATTACH", byKind(plan, "attach").map(describeAttach)),
    ...section("REFRESH", byKind(plan, "refresh").map(describeRefresh)),
    ...section(
      ADDRESS_CHANGE_HEADING,
      addressChanges.map(
        (warning) => `${tag(warning.legacyUserId)} ${warning.detail} — warn this athlete`,
      ),
    ),
    ...section(
      "CONFLICTS",
      plan.conflicts.map(
        (conflict) =>
          `${tag(conflict.legacyUserId)} ${CONFLICT_LABELS[conflict.reason]}: ${conflict.detail}`,
      ),
    ),
    ...section("WARNINGS", otherWarnings.map(describeWarning)),
    ...verdictLines(plan, mode),
  ];
};

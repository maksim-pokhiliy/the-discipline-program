import type {
  ConflictReason,
  ImportAction,
  ImportPlan,
  ImportWarning,
  WarningKind,
} from "./legacy-users-import-plan";

export type ReportMode = "dry-run" | "applied";

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
} satisfies Record<ConflictReason, string>;

const WARNING_LABELS = {
  "login-address-changes": "app login address changes",
  "matched-user-is-not-an-athlete": "matched platform user is not an athlete",
  "password-left-as-is": "platform credential kept, legacy hash not written",
  "identity-absent-from-source": "stored identity missing from this export",
  "identity-target-drift": "stored identity sits on a different user than the evidence names",
  "synthetic-email-no-credential": "synthetic address, no usable credential",
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

const describeRefresh = (action: Extract<ImportAction, { kind: "refresh" }>): string => {
  const changes =
    action.identityChanges.length === 0
      ? "no change"
      : action.identityChanges
          .map((change) => `${change.field} ${change.from} -> ${change.to}`)
          .join(", ");
  const credential =
    action.passwordChange.kind === "restored" ? "; credential restored from the export" : "";

  return `${tag(action.row.legacyUserId)} ${action.userEmail}  ${changes}${credential}`;
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
  const linkCount = attachments.filter((action) => action.matchedBy === "link").length;
  const emailCount = attachments.length - linkCount;
  const addressChanges = plan.warnings.filter(
    (warning) => warning.kind === "login-address-changes",
  ).length;

  return (
    `create ${byKind(plan, "create").length} · attach ${attachments.length} ` +
    `(link ${linkCount} / address ${emailCount}) · refresh ${byKind(plan, "refresh").length} · ` +
    `login-address changes ${addressChanges} · conflicts ${plan.conflicts.length} · ` +
    `warnings ${plan.warnings.length}`
  );
};

const verdictLines = (plan: ImportPlan, mode: ReportMode): readonly string[] => {
  if (plan.conflicts.length > 0) {
    return [
      "",
      mode === "applied"
        ? "REFUSED: nothing was written. Every conflict above has to be resolved first."
        : "REFUSED: this export would not be applied while any conflict above stands.",
      "Resolve a conflict by fixing the platform row, or by removing that row from the export and re-running.",
    ];
  }

  return [
    "",
    mode === "applied"
      ? "APPLIED: every action above was written in one transaction."
      : "CLEAN: re-run with --write --expect-host=<hostname> to apply. Take that hostname from " +
        "your own record of the database you meant, never from this report.",
  ];
};

export const renderImportReport = (plan: ImportPlan, mode: ReportMode): readonly string[] => {
  const addressChanges = plan.warnings.filter(
    (warning) => warning.kind === "login-address-changes",
  );
  const otherWarnings = plan.warnings.filter((warning) => warning.kind !== "login-address-changes");

  return [
    mode === "applied"
      ? "legacy users import — APPLIED"
      : "legacy users import — DRY RUN, nothing was written",
    summaryLine(plan),
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

import {
  attachConflict,
  attachWarnings,
  buildIndexes,
  refreshOutcome,
  resolveMatch,
  rowWarnings,
} from "./legacy-users-import-match";
import {
  type ClassifyOptions,
  describeUnmappedCatalogIds,
  type ImportAction,
  type ImportConflict,
  type ImportPlan,
  type ImportWarning,
  type PlatformSnapshot,
} from "./legacy-users-import-plan";
import { reconcileIdentityLinks } from "./legacy-users-import-reconcile";
import type { ParsedLegacySource, SourceDefect } from "./legacy-users-import-source";

const duplicatesOf = <T>(values: readonly T[]): Set<T> => {
  const seen = new Set<T>();
  const repeated = new Set<T>();

  for (const value of values) {
    if (seen.has(value)) {
      repeated.add(value);
    }

    seen.add(value);
  }

  return repeated;
};

const defectToConflict = (defect: SourceDefect): ImportConflict =>
  defect.kind === "username-not-an-email"
    ? {
        legacyUserId: defect.legacyUserId,
        reason: "username-not-an-email",
        detail: "the legacy username is not an email address and carries no ratified override",
      }
    : {
        legacyUserId: defect.legacyUserId,
        reason: "override-source-mismatch",
        detail: `the ratified override expects the legacy username ${defect.expectedUsername}`,
      };

const targetUserIdOf = (action: ImportAction): string | null =>
  action.kind === "create" ? null : action.userId;

const withClaimCollisions = (
  actions: readonly ImportAction[],
): { actions: ImportAction[]; conflicts: ImportConflict[] } => {
  const claimedBy = new Map<string, number[]>();

  for (const action of actions) {
    const userId = targetUserIdOf(action);

    if (userId !== null) {
      claimedBy.set(userId, [...(claimedBy.get(userId) ?? []), action.row.legacyUserId]);
    }
  }

  const contested = [...claimedBy.entries()].filter(([, ids]) => ids.length > 1);
  const contestedIds = new Set(contested.map(([userId]) => userId));
  const conflicts = contested.flatMap(([, ids]) =>
    ids.map((legacyUserId) => ({
      legacyUserId,
      reason: "platform-user-claimed-twice" as const,
      detail: `legacy ids ${ids.join(", ")} all resolve to one platform user, which can hold only one legacy identity`,
    })),
  );

  return {
    actions: actions.filter((action) => {
      const userId = targetUserIdOf(action);

      return userId === null || !contestedIds.has(userId);
    }),
    conflicts,
  };
};

const identitiesAbsentFromSource = (
  snapshot: PlatformSnapshot,
  sourceIds: ReadonlySet<number>,
): ImportWarning[] =>
  snapshot.identities
    .filter((identity) => !sourceIds.has(identity.legacyUserId))
    .map((identity) => ({
      legacyUserId: identity.legacyUserId,
      kind: "identity-absent-from-source" as const,
      detail:
        "this legacy id was imported before but is missing from this export; nothing is deleted",
    }));

export const classifyImport = (
  source: ParsedLegacySource,
  snapshot: PlatformSnapshot,
  options: ClassifyOptions = { isCredentialRestoreEnabled: false },
): ImportPlan => {
  const indexes = buildIndexes(snapshot);
  const conflicts: ImportConflict[] = source.defects.map(defectToConflict);
  const warnings: ImportWarning[] = [];
  const staged: ImportAction[] = [];

  const repeatedEmails = duplicatesOf(source.rows.map((row) => row.email));
  const repeatedIds = duplicatesOf([
    ...source.rows.map((row) => row.legacyUserId),
    ...source.defects.map((defect) => defect.legacyUserId),
  ]);

  for (const row of source.rows) {
    if (repeatedIds.has(row.legacyUserId)) {
      conflicts.push({
        legacyUserId: row.legacyUserId,
        reason: "duplicate-legacy-id-in-source",
        detail: "this legacy id appears more than once in the export",
      });

      continue;
    }

    if (repeatedEmails.has(row.email)) {
      conflicts.push({
        legacyUserId: row.legacyUserId,
        reason: "duplicate-email-in-source",
        detail: "two export rows normalize to the same email address",
      });

      continue;
    }

    const unmapped = describeUnmappedCatalogIds(row);

    if (unmapped !== null) {
      conflicts.push({
        legacyUserId: row.legacyUserId,
        reason: "catalog-id-out-of-range",
        detail: unmapped,
      });

      continue;
    }

    const resolution = resolveMatch(row, indexes);

    if (resolution.kind === "conflict") {
      conflicts.push({
        legacyUserId: row.legacyUserId,
        reason: resolution.reason,
        detail: resolution.detail,
      });

      continue;
    }

    if (resolution.kind === "create") {
      staged.push({ kind: "create", row });
      warnings.push(...rowWarnings(row));

      continue;
    }

    if (resolution.kind === "attach") {
      const conflict = attachConflict(row, resolution.user);

      if (conflict !== null) {
        conflicts.push(conflict);

        continue;
      }

      staged.push({
        kind: "attach",
        row,
        userId: resolution.user.id,
        userEmail: resolution.user.email,
        matchedBy: resolution.matchedBy,
      });
      warnings.push(...attachWarnings(row, resolution.user, resolution.matchedBy));
      warnings.push(...rowWarnings(row));

      continue;
    }

    const outcome = refreshOutcome(row, resolution.identity, indexes, options);

    if ("conflict" in outcome) {
      conflicts.push(outcome.conflict);

      continue;
    }

    staged.push(outcome.action);
    warnings.push(...outcome.warnings, ...rowWarnings(row));
  }

  const claims = withClaimCollisions(staged);
  const sourceIds = new Set(source.rows.map((row) => row.legacyUserId));
  const reconciled = reconcileIdentityLinks(snapshot);

  return {
    actions: claims.actions,
    conflicts: [...conflicts, ...claims.conflicts, ...reconciled.conflicts],
    warnings: [...warnings, ...identitiesAbsentFromSource(snapshot, sourceIds)],
    reconciliation: reconciled.summary,
  };
};

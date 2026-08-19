import {
  ATHLETE_ROLE,
  decidePasswordChange,
  diffIdentity,
  type ImportAction,
  type ImportConflict,
  type ImportWarning,
  type MatchedBy,
  type PlatformIdentity,
  type PlatformSnapshot,
  type PlatformUser,
} from "./legacy-users-import-plan";
import type { NormalizedLegacyUser } from "./legacy-users-import-source";

export type Indexes = {
  identityByLegacyId: Map<number, PlatformIdentity>;
  athleteIdsByLegacyId: Map<number, Set<string>>;
  userById: Map<string, PlatformUser>;
  userByEmail: Map<string, PlatformUser>;
};

export type Resolution =
  | { kind: "refresh"; identity: PlatformIdentity }
  | { kind: "attach"; user: PlatformUser; matchedBy: MatchedBy }
  | { kind: "create" }
  | { kind: "conflict"; reason: ImportConflict["reason"]; detail: string };

export const buildIndexes = (snapshot: PlatformSnapshot): Indexes => {
  const athleteIdsByLegacyId = new Map<number, Set<string>>();

  for (const link of snapshot.individualLinks) {
    const athleteIds = athleteIdsByLegacyId.get(link.legacyUserId) ?? new Set<string>();

    athleteIds.add(link.athleteId);
    athleteIdsByLegacyId.set(link.legacyUserId, athleteIds);
  }

  return {
    identityByLegacyId: new Map(snapshot.identities.map((row) => [row.legacyUserId, row])),
    athleteIdsByLegacyId,
    userById: new Map(snapshot.users.map((row) => [row.id, row])),
    userByEmail: new Map(snapshot.users.map((row) => [row.email, row])),
  };
};

export const resolveMatch = (row: NormalizedLegacyUser, indexes: Indexes): Resolution => {
  const identity = indexes.identityByLegacyId.get(row.legacyUserId);

  if (identity !== undefined) {
    return { kind: "refresh", identity };
  }

  const athleteIds = indexes.athleteIdsByLegacyId.get(row.legacyUserId) ?? new Set<string>();

  if (athleteIds.size > 1) {
    return {
      kind: "conflict",
      reason: "ambiguous-link",
      detail: `${athleteIds.size} individual publish links carry this legacy id but name different athletes`,
    };
  }

  const [linkedAthleteId] = [...athleteIds];
  const linkedUser =
    linkedAthleteId === undefined ? undefined : indexes.userById.get(linkedAthleteId);
  const emailUser = indexes.userByEmail.get(row.email);

  if (linkedAthleteId !== undefined && linkedUser === undefined) {
    return {
      kind: "conflict",
      reason: "identity-user-missing",
      detail: "an individual publish link names a platform user that no longer exists",
    };
  }

  if (linkedUser !== undefined && emailUser !== undefined && linkedUser.id !== emailUser.id) {
    return {
      kind: "conflict",
      reason: "link-and-email-disagree",
      detail: `the publish link names ${linkedUser.email} while the legacy address matches ${emailUser.email}`,
    };
  }

  if (linkedUser !== undefined) {
    return { kind: "attach", user: linkedUser, matchedBy: "link" };
  }

  return emailUser === undefined
    ? { kind: "create" }
    : { kind: "attach", user: emailUser, matchedBy: "email" };
};

export const attachConflict = (
  row: NormalizedLegacyUser,
  user: PlatformUser,
): ImportConflict | null => {
  if (user.deletedAt !== null) {
    return {
      legacyUserId: row.legacyUserId,
      reason: "matched-user-soft-deleted",
      detail: "the matched platform user is soft-deleted",
    };
  }

  if (user.identityLegacyUserId !== null && user.identityLegacyUserId !== row.legacyUserId) {
    return {
      legacyUserId: row.legacyUserId,
      reason: "matched-user-has-other-identity",
      detail: `the matched platform user already carries legacy id ${user.identityLegacyUserId}`,
    };
  }

  return null;
};

export const attachWarnings = (
  row: NormalizedLegacyUser,
  user: PlatformUser,
  matchedBy: MatchedBy,
): ImportWarning[] => {
  const warnings: ImportWarning[] = [];

  if (user.role !== ATHLETE_ROLE) {
    warnings.push({
      legacyUserId: row.legacyUserId,
      kind: "matched-user-is-not-an-athlete",
      detail: `${user.email} has platform role ${user.role}; the legacy role is mirrored but grants nothing`,
    });
  }

  if (user.password === null && row.passwordHash !== null) {
    warnings.push({
      legacyUserId: row.legacyUserId,
      kind: "matched-user-has-no-credential",
      detail: `${user.email} carries no platform password, and the legacy hash is not written to a matched user; this person cannot sign in until they set one`,
    });
  }

  if (matchedBy === "link" && user.email !== row.email) {
    warnings.push({
      legacyUserId: row.legacyUserId,
      kind: "login-address-changes",
      detail: `app login becomes ${user.email} (the legacy address was ${row.sourceUsername})`,
    });
  }

  return warnings;
};

export const rowWarnings = (row: NormalizedLegacyUser): ImportWarning[] => {
  const warnings: ImportWarning[] = [];

  if (row.isSyntheticEmail) {
    warnings.push({
      legacyUserId: row.legacyUserId,
      kind: "synthetic-email-no-credential",
      detail: `imported as ${row.email}, force-disabled and with no usable credential`,
    });
  }

  if (row.hasLegacyTeam) {
    warnings.push({
      legacyUserId: row.legacyUserId,
      kind: "legacy-team-dropped",
      detail: "the legacy row names a team; the platform identity has nowhere to keep it",
    });
  }

  return warnings;
};

const driftWarning = (
  row: NormalizedLegacyUser,
  identity: PlatformIdentity,
  indexes: Indexes,
): ImportWarning | null => {
  const linkedAthleteIds = indexes.athleteIdsByLegacyId.get(row.legacyUserId) ?? new Set<string>();
  const emailUserId = indexes.userByEmail.get(row.email)?.id;
  const elsewhere = [...linkedAthleteIds, emailUserId].filter(
    (candidate): candidate is string => candidate !== undefined && candidate !== identity.userId,
  );

  return elsewhere.length === 0
    ? null
    : {
        legacyUserId: row.legacyUserId,
        kind: "identity-target-drift",
        detail:
          "a publish link or the legacy address now names a different platform user; the stored identity is left where it is",
      };
};

export const refreshOutcome = (
  row: NormalizedLegacyUser,
  identity: PlatformIdentity,
  indexes: Indexes,
): { action: ImportAction; warnings: ImportWarning[] } | { conflict: ImportConflict } => {
  const user = indexes.userById.get(identity.userId);

  if (user === undefined) {
    return {
      conflict: {
        legacyUserId: row.legacyUserId,
        reason: "identity-user-missing",
        detail: "the stored legacy identity names a platform user that no longer exists",
      },
    };
  }

  if (user.deletedAt !== null) {
    return {
      conflict: {
        legacyUserId: row.legacyUserId,
        reason: "matched-user-soft-deleted",
        detail: "the platform user behind the stored legacy identity is soft-deleted",
      },
    };
  }

  const passwordChange = decidePasswordChange(user.password, row.passwordHash);
  const warnings: ImportWarning[] = [];

  if (passwordChange.kind === "left-as-is" && user.password !== row.passwordHash) {
    warnings.push({
      legacyUserId: row.legacyUserId,
      kind: "password-left-as-is",
      detail: `${user.email} carries a platform-managed credential; the legacy hash is not written`,
    });
  }

  const drift = driftWarning(row, identity, indexes);

  if (drift !== null) {
    warnings.push(drift);
  }

  return {
    action: {
      kind: "refresh",
      row,
      userId: identity.userId,
      userEmail: user.email,
      identityChanges: diffIdentity(identity, row),
      passwordChange,
    },
    warnings,
  };
};

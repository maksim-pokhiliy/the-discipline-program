import { AUTH_CONSTANTS } from "@repo/contracts/iam/auth";

import { readBcryptCost } from "../src/endpoints/iam/bcrypt-cost";
import {
  findLegacyCatalogEntry,
  LEGACY_TRAINING_LEVELS,
  LEGACY_USER_PLANS,
  LEGACY_USER_ROLES,
} from "../src/endpoints/mobile-compat/legacy-catalogs";
import { serializeLegacyDate } from "../src/endpoints/mobile-compat/legacy-date";

import type { NormalizedLegacyUser } from "./legacy-users-import-source";

export const ATHLETE_ROLE = "ATHLETE";
export { readBcryptCost };

export const IDENTITY_MIRROR_FIELDS = [
  "legacyRoleId",
  "legacyPlanId",
  "legacyLevelId",
  "isEnabled",
  "firstName",
  "lastName",
  "phoneNumber",
  "dateOfBirth",
] as const;

export type IdentityMirrorField = (typeof IDENTITY_MIRROR_FIELDS)[number];

export type IdentityMirror = Pick<NormalizedLegacyUser, IdentityMirrorField>;

export type PlatformIdentity = IdentityMirror & {
  legacyUserId: number;
  userId: string;
};

export type PlatformIndividualLink = { legacyUserId: number; athleteId: string };

export type PlatformUser = {
  id: string;
  email: string;
  matchEmail: string;
  role: string;
  deletedAt: Date | null;
  password: string | null;
  identityLegacyUserId: number | null;
};

export type PlatformSnapshot = {
  identities: readonly PlatformIdentity[];
  individualLinks: readonly PlatformIndividualLink[];
  users: readonly PlatformUser[];
};

export type FieldChange = { field: string; from: string; to: string };

export type PasswordLeftReason =
  | "no-source-credential"
  | "matched-user-has-none"
  | "platform-managed"
  | "restore-not-enabled";

export type PasswordChange =
  | { kind: "unchanged" }
  | { kind: "restored"; expectedStoredHash: string }
  | { kind: "left-as-is"; reason: PasswordLeftReason };

export type ClassifyOptions = { isCredentialRestoreEnabled: boolean };

export type MatchedBy = "link" | "email";

export type ImportAction =
  | { kind: "create"; row: NormalizedLegacyUser }
  | {
      kind: "attach";
      row: NormalizedLegacyUser;
      userId: string;
      userEmail: string;
      matchedBy: MatchedBy;
    }
  | {
      kind: "refresh";
      row: NormalizedLegacyUser;
      userId: string;
      userEmail: string;
      identityChanges: readonly FieldChange[];
      passwordChange: PasswordChange;
    };

export type ConflictReason =
  | "username-not-an-email"
  | "override-source-mismatch"
  | "duplicate-email-in-source"
  | "duplicate-legacy-id-in-source"
  | "catalog-id-out-of-range"
  | "link-and-email-disagree"
  | "ambiguous-link"
  | "matched-user-soft-deleted"
  | "matched-user-has-other-identity"
  | "platform-user-claimed-twice"
  | "identity-user-missing";

export type WarningKind =
  | "login-address-changes"
  | "matched-user-is-not-an-athlete"
  | "password-left-as-is"
  | "identity-absent-from-source"
  | "identity-target-drift"
  | "synthetic-email-no-credential"
  | "matched-user-has-no-credential"
  | "credential-differs-not-restored"
  | "credential-restored"
  | "legacy-team-dropped";

export type ImportConflict = { legacyUserId: number; reason: ConflictReason; detail: string };

export type ImportWarning = { legacyUserId: number; kind: WarningKind; detail: string };

export type ImportPlan = {
  actions: readonly ImportAction[];
  conflicts: readonly ImportConflict[];
  warnings: readonly ImportWarning[];
};

export const describeUnmappedCatalogIds = (row: NormalizedLegacyUser): string | null => {
  const checks: readonly [string, number, ReturnType<typeof findLegacyCatalogEntry>][] = [
    ["role", row.legacyRoleId, findLegacyCatalogEntry(LEGACY_USER_ROLES, row.legacyRoleId)],
    ["plan", row.legacyPlanId, findLegacyCatalogEntry(LEGACY_USER_PLANS, row.legacyPlanId)],
    ["level", row.legacyLevelId, findLegacyCatalogEntry(LEGACY_TRAINING_LEVELS, row.legacyLevelId)],
  ];
  const unmapped = checks.filter(([, , entry]) => entry === null);

  return unmapped.length === 0
    ? null
    : unmapped.map(([label, id]) => `${label} id ${id} is not in the legacy catalog`).join("; ");
};

export const ABSENT_MIRROR_VALUE = "(none)";

export const renderMirrorValue = (value: IdentityMirror[IdentityMirrorField]): string => {
  if (value === null) {
    return ABSENT_MIRROR_VALUE;
  }

  if (value instanceof Date) {
    return serializeLegacyDate(value) ?? ABSENT_MIRROR_VALUE;
  }

  return typeof value === "string" ? JSON.stringify(value) : String(value);
};

export const diffIdentity = (
  current: IdentityMirror,
  row: IdentityMirror,
): readonly FieldChange[] =>
  IDENTITY_MIRROR_FIELDS.flatMap((field) => {
    const from = renderMirrorValue(current[field]);
    const to = renderMirrorValue(row[field]);

    return from === to ? [] : [{ field, from, to }];
  });

export const decidePasswordChange = (
  storedHash: string | null,
  sourceHash: string | null,
  isCredentialRestoreEnabled: boolean,
): PasswordChange => {
  if (sourceHash === null) {
    return { kind: "left-as-is", reason: "no-source-credential" };
  }

  if (storedHash === null) {
    return { kind: "left-as-is", reason: "matched-user-has-none" };
  }

  if (storedHash === sourceHash) {
    return { kind: "unchanged" };
  }

  const cost = readBcryptCost(storedHash);

  if (cost === null || cost >= AUTH_CONSTANTS.BCRYPT_COST_FACTOR) {
    return { kind: "left-as-is", reason: "platform-managed" };
  }

  return isCredentialRestoreEnabled
    ? { kind: "restored", expectedStoredHash: storedHash }
    : { kind: "left-as-is", reason: "restore-not-enabled" };
};

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
export const PLATFORM_BCRYPT_COST = AUTH_CONSTANTS.BCRYPT_COST_FACTOR;

export { readBcryptCost };

export type PlatformIdentity = {
  legacyUserId: number;
  userId: string;
  legacyRoleId: number;
  legacyPlanId: number;
  legacyLevelId: number;
  isEnabled: boolean;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  dateOfBirth: Date | null;
};

export type PlatformIndividualLink = { legacyUserId: number; athleteId: string };

export type PlatformUser = {
  id: string;
  email: string;
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

export type PasswordChange = { kind: "unchanged" } | { kind: "restored" } | { kind: "left-as-is" };

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

export const diffIdentity = (
  current: PlatformIdentity,
  row: NormalizedLegacyUser,
): readonly FieldChange[] => {
  const pairs: readonly [string, string, string][] = [
    ["legacyRoleId", String(current.legacyRoleId), String(row.legacyRoleId)],
    ["legacyPlanId", String(current.legacyPlanId), String(row.legacyPlanId)],
    ["legacyLevelId", String(current.legacyLevelId), String(row.legacyLevelId)],
    ["isEnabled", String(current.isEnabled), String(row.isEnabled)],
    ["firstName", String(current.firstName), String(row.firstName)],
    ["lastName", String(current.lastName), String(row.lastName)],
    ["phoneNumber", String(current.phoneNumber), String(row.phoneNumber)],
    [
      "dateOfBirth",
      String(serializeLegacyDate(current.dateOfBirth)),
      String(serializeLegacyDate(row.dateOfBirth)),
    ],
  ];

  return pairs
    .filter(([, from, to]) => from !== to)
    .map(([field, from, to]) => ({ field, from, to }));
};

export const decidePasswordChange = (
  storedHash: string | null,
  sourceHash: string | null,
): PasswordChange => {
  if (sourceHash === null || storedHash === null) {
    return { kind: "left-as-is" };
  }

  if (storedHash === sourceHash) {
    return { kind: "unchanged" };
  }

  const cost = readBcryptCost(storedHash);

  return cost !== null && cost < PLATFORM_BCRYPT_COST
    ? { kind: "restored" }
    : { kind: "left-as-is" };
};

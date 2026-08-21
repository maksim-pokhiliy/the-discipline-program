import {
  ATHLETE_ROLE,
  type CredentialOutcome,
  type IdentityMirror,
  type ImportAction,
  type ImportPlan,
} from "./legacy-users-import-plan";
import type { NormalizedLegacyUser } from "./legacy-users-import-source";

export type ImportWriter = {
  user: {
    create: (args: {
      data: {
        email: string;
        name: string | null;
        password: string | null;
        role: typeof ATHLETE_ROLE;
      };
      select: { id: true };
    }) => Promise<{ id: string }>;
    update: (args: {
      where: { id: string; password: string | null };
      data: { password: string };
    }) => Promise<unknown>;
  };
  mobileLegacyIdentity: {
    create: (args: {
      data: IdentityMirror & {
        userId: string;
        legacyUserId: number;
        importedPasswordHash: string | null;
      };
    }) => Promise<unknown>;
    update: (args: {
      where: { legacyUserId: number };
      data: IdentityMirror & { importedPasswordHash?: string };
    }) => Promise<unknown>;
  };
};

export class ImportConflictError extends Error {
  constructor(public readonly conflictCount: number) {
    super(
      `refusing to write: ${conflictCount} conflict(s) stand. Nothing was written; the report lists every one.`,
    );
    this.name = "ImportConflictError";
  }
}

const mirrorOf = (row: NormalizedLegacyUser): IdentityMirror => ({
  legacyRoleId: row.legacyRoleId,
  legacyPlanId: row.legacyPlanId,
  legacyLevelId: row.legacyLevelId,
  isEnabled: row.isEnabled,
  firstName: row.firstName,
  lastName: row.lastName,
  phoneNumber: row.phoneNumber,
  dateOfBirth: row.dateOfBirth,
});

const markerWriteOf = (outcome: CredentialOutcome): string | null => {
  if (outcome.kind === "marker-backfilled") {
    return outcome.markerHash;
  }

  return outcome.kind === "restored" ? outcome.nextHash : null;
};

const applyRefresh = async (
  writer: ImportWriter,
  action: Extract<ImportAction, { kind: "refresh" }>,
): Promise<void> => {
  const { credentialOutcome } = action;
  const markerWrite = markerWriteOf(credentialOutcome);

  if (credentialOutcome.kind === "restored") {
    await writer.user.update({
      where: { id: action.userId, password: credentialOutcome.expectedStoredHash },
      data: { password: credentialOutcome.nextHash },
    });
  }

  if (action.identityChanges.length > 0 || markerWrite !== null) {
    await writer.mobileLegacyIdentity.update({
      where: { legacyUserId: action.row.legacyUserId },
      data:
        markerWrite === null
          ? mirrorOf(action.row)
          : { ...mirrorOf(action.row), importedPasswordHash: markerWrite },
    });
  }
};

export const applyImport = async (writer: ImportWriter, plan: ImportPlan): Promise<void> => {
  if (plan.conflicts.length > 0) {
    throw new ImportConflictError(plan.conflicts.length);
  }

  for (const action of plan.actions) {
    if (action.kind === "create") {
      const created = await writer.user.create({
        data: {
          email: action.row.email,
          name: action.row.name,
          password: action.row.passwordHash,
          role: ATHLETE_ROLE,
        },
        select: { id: true },
      });

      await writer.mobileLegacyIdentity.create({
        data: {
          userId: created.id,
          legacyUserId: action.row.legacyUserId,
          importedPasswordHash: action.row.passwordHash,
          ...mirrorOf(action.row),
        },
      });

      continue;
    }

    if (action.kind === "attach") {
      await writer.mobileLegacyIdentity.create({
        data: {
          userId: action.userId,
          legacyUserId: action.row.legacyUserId,
          importedPasswordHash: null,
          ...mirrorOf(action.row),
        },
      });

      continue;
    }

    await applyRefresh(writer, action);
  }
};

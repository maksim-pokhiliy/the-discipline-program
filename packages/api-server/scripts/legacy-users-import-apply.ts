import { ATHLETE_ROLE, type IdentityMirror, type ImportPlan } from "./legacy-users-import-plan";
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
      data: IdentityMirror & { userId: string; legacyUserId: number };
    }) => Promise<unknown>;
    update: (args: { where: { legacyUserId: number }; data: IdentityMirror }) => Promise<unknown>;
  };
};

export type ApplyCounts = {
  created: number;
  attached: number;
  refreshed: number;
  credentialsRestored: number;
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

export const applyImport = async (writer: ImportWriter, plan: ImportPlan): Promise<ApplyCounts> => {
  if (plan.conflicts.length > 0) {
    throw new ImportConflictError(plan.conflicts.length);
  }

  const counts: ApplyCounts = { created: 0, attached: 0, refreshed: 0, credentialsRestored: 0 };

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
          ...mirrorOf(action.row),
        },
      });

      counts.created += 1;

      continue;
    }

    if (action.kind === "attach") {
      await writer.mobileLegacyIdentity.create({
        data: {
          userId: action.userId,
          legacyUserId: action.row.legacyUserId,
          ...mirrorOf(action.row),
        },
      });

      counts.attached += 1;

      continue;
    }

    if (action.identityChanges.length > 0) {
      await writer.mobileLegacyIdentity.update({
        where: { legacyUserId: action.row.legacyUserId },
        data: mirrorOf(action.row),
      });
    }

    counts.refreshed += 1;

    if (action.passwordChange.kind === "restored" && action.row.passwordHash !== null) {
      await writer.user.update({
        where: { id: action.userId, password: action.passwordChange.expectedStoredHash },
        data: { password: action.row.passwordHash },
      });

      counts.credentialsRestored += 1;
    }
  }

  return counts;
};

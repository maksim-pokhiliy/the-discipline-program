import { InternalServerError } from "@repo/errors";

import { prisma } from "../../db/client";

import {
  findLegacyCatalogEntry,
  LEGACY_TRAINING_LEVELS,
  LEGACY_USER_PLANS,
  LEGACY_USER_ROLES,
} from "./legacy-catalogs";
import { type LegacyUserDto, serializeLegacyDate } from "./wire-schemas";

type LegacyIdentityRow = {
  legacyUserId: number;
  legacyRoleId: number;
  legacyPlanId: number;
  legacyLevelId: number;
  isEnabled: boolean;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  dateOfBirth: Date | null;
};

export const assembleUserDto = (row: LegacyIdentityRow, email: string): LegacyUserDto => {
  const userRole = findLegacyCatalogEntry(LEGACY_USER_ROLES, row.legacyRoleId);
  const userPlan = findLegacyCatalogEntry(LEGACY_USER_PLANS, row.legacyPlanId);
  const trainingLevel = findLegacyCatalogEntry(LEGACY_TRAINING_LEVELS, row.legacyLevelId);

  if (!userRole || !userPlan || !trainingLevel) {
    throw new InternalServerError("Legacy catalog id is not mapped", {
      legacyRoleId: row.legacyRoleId,
      legacyPlanId: row.legacyPlanId,
      legacyLevelId: row.legacyLevelId,
    });
  }

  return {
    id: row.legacyUserId,
    isEnabled: row.isEnabled,
    username: email,
    userRole,
    userPlan,
    trainingLevel,
    firstName: row.firstName,
    lastName: row.lastName,
    phoneNumber: row.phoneNumber,
    dateOfBirth: serializeLegacyDate(row.dateOfBirth),
    team: null,
  };
};

export const loadUserDto = async (userId: string): Promise<LegacyUserDto | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      legacyIdentity: {
        select: {
          legacyUserId: true,
          legacyRoleId: true,
          legacyPlanId: true,
          legacyLevelId: true,
          isEnabled: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          dateOfBirth: true,
        },
      },
    },
  });

  if (!user || !user.legacyIdentity) {
    return null;
  }

  return assembleUserDto(user.legacyIdentity, user.email);
};

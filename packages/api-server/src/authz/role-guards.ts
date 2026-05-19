import { UserRole } from "@repo/contracts/iam/auth";
import { ForbiddenError } from "@repo/errors";

import { prisma } from "../db/client";
import { ROLE_MAP } from "../mappers/iam";
import { findOrThrow } from "../utils";

import { isAdminOrHeadCoach } from "./_role-helpers";

const COACH_LIKE_ROLES: ReadonlySet<UserRole> = new Set([
  UserRole.COACH,
  UserRole.HEAD_COACH,
  UserRole.ADMIN,
]);

export const requireAdmin = async (userId: string): Promise<void> => {
  const user = await findOrThrow(
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    "User",
  );

  if (!isAdminOrHeadCoach(ROLE_MAP[user.role])) {
    throw new ForbiddenError("Admin role required");
  }
};

export const requireAdminStrict = async (userId: string): Promise<void> => {
  const user = await findOrThrow(
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    "User",
  );

  if (ROLE_MAP[user.role] !== UserRole.ADMIN) {
    throw new ForbiddenError("Admin role required");
  }
};

export const requireCoachLikeRole = async (userId: string): Promise<UserRole> => {
  const user = await findOrThrow(
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    "User",
  );

  const role = ROLE_MAP[user.role];

  if (!COACH_LIKE_ROLES.has(role)) {
    throw new ForbiddenError("Coach role required");
  }

  return role;
};

export const resolveCoachId = async (userId: string): Promise<string> => {
  const profile = await prisma.coachProfile.findFirst({
    where: { userId, deletedAt: null },
    select: { id: true },
  });

  if (!profile) {
    throw new ForbiddenError("User does not have a coach profile", { userId });
  }

  return profile.id;
};

export const verifyAthleteBelongsToCoach = async (
  athleteUserId: string,
  coachId: string,
): Promise<void> => {
  const assignment = await prisma.coachAthleteAssignment.findUnique({
    where: { coachId_athleteId: { coachId, athleteId: athleteUserId } },
    select: { id: true },
  });

  if (!assignment) {
    throw new ForbiddenError("Athlete does not belong to this coach");
  }
};

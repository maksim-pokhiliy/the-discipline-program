import { UserRole } from "@repo/contracts/iam/auth";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../db/client";

import { isAdminOrHeadCoach } from "./_role-helpers";
import { resolveCallerRole } from "./resolve-caller-role";

const COACH_LIKE_ROLES: ReadonlySet<UserRole> = new Set([
  UserRole.COACH,
  UserRole.HEAD_COACH,
  UserRole.ADMIN,
]);

const resolveCallerRoleOrThrow = async (userId: string): Promise<UserRole> => {
  const role = await resolveCallerRole(userId);

  if (role === null) {
    throw new NotFoundError("User not found");
  }

  return role;
};

export const requireAdmin = async (userId: string): Promise<void> => {
  const role = await resolveCallerRoleOrThrow(userId);

  if (!isAdminOrHeadCoach(role)) {
    throw new ForbiddenError("Admin role required");
  }
};

export const requireAdminStrict = async (userId: string): Promise<void> => {
  const role = await resolveCallerRoleOrThrow(userId);

  if (role !== UserRole.ADMIN) {
    throw new ForbiddenError("Admin role required");
  }
};

export const requireCoachLikeRole = async (userId: string): Promise<UserRole> => {
  const role = await resolveCallerRoleOrThrow(userId);

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

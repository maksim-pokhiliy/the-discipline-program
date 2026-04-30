import { UserRole } from "@repo/contracts/iam/auth";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../db/client";
import { ROLE_MAP } from "../mappers/iam";
import { findOrThrow } from "../utils";

const ADMIN_OR_HEAD_COACH: ReadonlySet<UserRole> = new Set([UserRole.ADMIN, UserRole.HEAD_COACH]);

const COACH_LIKE_ROLES: ReadonlySet<UserRole> = new Set([
  UserRole.COACH,
  UserRole.HEAD_COACH,
  UserRole.ADMIN,
]);

const isAdminOrHeadCoach = (role: UserRole): boolean => ADMIN_OR_HEAD_COACH.has(role);

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

export const verifyPlanOwnership = async (planId: string, userId: string): Promise<void> => {
  const plan = await prisma.trainingPlan.findUnique({
    where: { id: planId },
    select: { creatorId: true, deletedAt: true },
  });

  if (!plan || plan.deletedAt !== null) {
    throw new NotFoundError("Training plan not found", { planId });
  }

  if (plan.creatorId === userId) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user && isAdminOrHeadCoach(ROLE_MAP[user.role])) {
    return;
  }

  const assignment = await prisma.planCoachAssignment.findUnique({
    where: { planId_coachId: { planId, coachId: userId } },
    select: { id: true },
  });

  if (!assignment) {
    throw new ForbiddenError("Training plan does not belong to this coach");
  }
};

export const verifyAthleteBelongsToCoach = async (
  athleteUserId: string,
  coachId: string,
): Promise<void> => {
  const coachProfile = await prisma.coachProfile.findUnique({
    where: { id: coachId },
    select: { userId: true },
  });

  if (coachProfile) {
    const coachUser = await prisma.user.findUnique({
      where: { id: coachProfile.userId },
      select: { role: true },
    });

    if (coachUser && isAdminOrHeadCoach(ROLE_MAP[coachUser.role])) {
      return;
    }
  }

  const assignment = await prisma.coachAthleteAssignment.findUnique({
    where: { coachId_athleteId: { coachId, athleteId: athleteUserId } },
    select: { id: true },
  });

  if (!assignment) {
    throw new ForbiddenError("Athlete does not belong to this coach");
  }
};

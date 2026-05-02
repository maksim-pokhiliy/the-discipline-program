import { type User as PrismaUser } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";
import { type UpdateUserData, type User } from "@repo/contracts/iam/user";
import { BadRequestError, ConflictError, ForbiddenError } from "@repo/errors";

import { prisma } from "../../db/client";
import { type TxClient } from "../../db/tx";
import { mapToUser, ROLE_MAP, ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { handlePrismaError } from "../../utils";

import { assertCoachesExist } from "./assignment-sync";
import {
  applyRoleEnter,
  applyRoleExit,
  assertNotLastAdminDemotion,
} from "./users-admin-role-lifecycle";

const dedupe = <T>(xs: T[]): T[] => Array.from(new Set(xs));

type UpdatePlan = {
  currentRole: UserRole;
  newRole: UserRole;
  roleChanged: boolean;
  isDemotionFromAdmin: boolean;
  updateData: UserUpdatePayload;
};

type UserUpdatePayload = {
  name?: string | null;
  role?: (typeof ROLE_TO_PRISMA_MAP)[UserRole];
  timezone?: string;
  tokenVersion?: { increment: number };
};

const buildUpdatePayload = (data: UpdateUserData, roleChanged: boolean): UserUpdatePayload => {
  const updateData: UserUpdatePayload = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.role !== undefined) {
    updateData.role = ROLE_TO_PRISMA_MAP[data.role];
  }

  if (data.timezone !== undefined) {
    updateData.timezone = data.timezone;
  }

  if (roleChanged) {
    updateData.tokenVersion = { increment: 1 };
  }

  return updateData;
};

const planUpdate = (existing: PrismaUser, data: UpdateUserData): UpdatePlan => {
  const currentRole = ROLE_MAP[existing.role];
  const roleChanged = data.role !== undefined && data.role !== currentRole;
  const isDemotionFromAdmin =
    data.role !== undefined && currentRole === UserRole.ADMIN && data.role !== UserRole.ADMIN;
  const newRole: UserRole = data.role ?? currentRole;

  return {
    currentRole,
    newRole,
    roleChanged,
    isDemotionFromAdmin,
    updateData: buildUpdatePayload(data, roleChanged),
  };
};

const assertHeadCoachUnique = async (id: string, newRole: UserRole): Promise<void> => {
  if (newRole !== UserRole.HEAD_COACH) {
    return;
  }

  const existingHC = await prisma.user.findFirst({
    where: { role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] },
  });

  if (existingHC && existingHC.id !== id) {
    throw new ConflictError("A HEAD_COACH already exists", { existingId: existingHC.id });
  }
};

const validateUpdate = (
  actorId: string,
  id: string,
  data: UpdateUserData,
  plan: UpdatePlan,
): void => {
  if (plan.isDemotionFromAdmin && actorId === id) {
    throw new ForbiddenError("Cannot demote yourself from admin");
  }

  if (
    data.coachIds !== undefined &&
    data.coachIds.length > 0 &&
    plan.newRole !== UserRole.ATHLETE
  ) {
    throw new BadRequestError("coach assignments are valid only for ATHLETE role");
  }
};

const applyInTx = async (
  tx: TxClient,
  id: string,
  data: UpdateUserData,
  plan: UpdatePlan,
): Promise<User> => {
  if (plan.isDemotionFromAdmin) {
    await assertNotLastAdminDemotion(tx);
  }

  if (data.coachIds !== undefined && data.coachIds.length > 0) {
    await assertCoachesExist(tx, dedupe(data.coachIds));
  }

  const updatedRow = await tx.user.update({
    where: { id },
    data: plan.updateData,
  });

  if (plan.roleChanged) {
    await applyRoleExit(tx, id, plan.currentRole);
  }

  await applyRoleEnter(tx, id, plan.newRole, data.coachIds);

  return mapToUser(updatedRow);
};

export const updateUserImpl = async (
  existing: PrismaUser,
  actorId: string,
  id: string,
  data: UpdateUserData,
): Promise<User> => {
  const plan = planUpdate(existing, data);

  validateUpdate(actorId, id, data, plan);
  await assertHeadCoachUnique(id, plan.newRole);

  try {
    return await prisma.$transaction((tx) => applyInTx(tx, id, data, plan));
  } catch (error) {
    return handlePrismaError(error, { entity: "User" });
  }
};

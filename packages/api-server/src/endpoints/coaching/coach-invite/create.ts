import { type CreateCoachInviteData } from "@repo/contracts/coaching/coach-invite";
import { UserRole } from "@repo/contracts/iam/auth";
import { type User } from "@repo/contracts/iam/user";

import { resolveCoachId } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { handlePrismaError } from "../../../utils";
import { resolveInviteEmailConfig } from "../../iam/send-invitation-email";
import { iamUserCreationApi } from "../../iam/user-creation";

export const create = async (userId: string, data: CreateCoachInviteData): Promise<User> => {
  const coachId = await resolveCoachId(userId);

  resolveInviteEmailConfig();

  let user: User;

  try {
    user = await prisma.$transaction(async (tx) => {
      const created = await iamUserCreationApi.createPendingUser(tx, {
        email: data.email,
        name: data.name,
        role: UserRole.ATHLETE,
        timezone: "UTC",
      });

      await tx.coachAthleteAssignment.create({
        data: { coachId, athleteId: created.id },
      });

      return created;
    });
  } catch (error) {
    return handlePrismaError(error, { entity: "User" });
  }

  await iamUserCreationApi.issueInviteAndSendEmail(userId, {
    id: user.id,
    email: user.email,
    name: user.name,
  });

  return user;
};

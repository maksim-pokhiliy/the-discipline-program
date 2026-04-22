import { UserRole } from "@repo/contracts/iam/auth";
import { BadRequestError, ConflictError, NotFoundError, TooManyRequestsError } from "@repo/errors";

import { resolveCoachId, verifyAthleteBelongsToCoach } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { ROLE_MAP } from "../../../mappers/iam";
import { findOrThrow } from "../../../utils";
import { resolveInviteEmailConfig } from "../../iam/send-invitation-email";
import { iamUserCreationApi } from "../../iam/user-creation";

const MS_PER_HOUR = 3_600_000;
const MAX_RESENDS_PER_DAY = 3;

export const resend = async (
  userId: string,
  inviteeUserId: string,
): Promise<{ expiresAt: Date }> => {
  const coachId = await resolveCoachId(userId);

  const invitee = await findOrThrow(
    prisma.user.findUnique({
      where: { id: inviteeUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        deletedAt: true,
      },
    }),
    "User",
  );

  if (invitee.deletedAt !== null) {
    throw new NotFoundError("User");
  }

  await verifyAthleteBelongsToCoach(invitee.id, coachId);

  if (ROLE_MAP[invitee.role] !== UserRole.ATHLETE) {
    throw new BadRequestError("User is not an athlete");
  }

  if (invitee.password !== null) {
    throw new ConflictError("User has already set a password — invite cannot be resent");
  }

  resolveInviteEmailConfig();

  const since = new Date(Date.now() - 24 * MS_PER_HOUR);
  const recentTokenCount = await prisma.userInviteToken.count({
    where: { userId: invitee.id, createdAt: { gte: since } },
  });

  if (recentTokenCount >= MAX_RESENDS_PER_DAY) {
    throw new TooManyRequestsError("Too many resends in 24 hours");
  }

  return iamUserCreationApi.issueInviteAndSendEmail(userId, {
    id: invitee.id,
    email: invitee.email,
    name: invitee.name,
  });
};

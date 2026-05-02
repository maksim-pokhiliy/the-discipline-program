import { UserRole } from "@repo/contracts/iam/auth";
import { BadRequestError, ConflictError, TooManyRequestsError } from "@repo/errors";

import { resolveCoachId, verifyAthleteBelongsToCoach } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { ROLE_MAP } from "../../../mappers/iam";
import { findOrThrow } from "../../../utils";
import { iamInviteTokenApi } from "../../iam/invite-token";
import { resolveInviteEmailConfig, sendInvitationEmail } from "../../iam/send-invitation-email";

const MS_PER_HOUR = 3_600_000;
const MAX_RESENDS_PER_DAY = 3;

export const resend = async (
  userId: string,
  inviteeUserId: string,
): Promise<{ expiresAt: Date }> => {
  const coachId = await resolveCoachId(userId);

  await verifyAthleteBelongsToCoach(inviteeUserId, coachId);

  const invitee = await findOrThrow(
    prisma.user.findUnique({
      where: { id: inviteeUserId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
      },
    }),
    "User",
  );

  if (ROLE_MAP[invitee.role] !== UserRole.ATHLETE) {
    throw new BadRequestError("User is not an athlete");
  }

  if (invitee.password !== null) {
    throw new ConflictError("User has already set a password — invite cannot be resent");
  }

  resolveInviteEmailConfig();

  const { plainToken, expiresAt } = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`resend:${invitee.id}`}))`;

    const since = new Date(Date.now() - 24 * MS_PER_HOUR);
    const recentTokenCount = await tx.userInviteToken.count({
      where: { userId: invitee.id, createdAt: { gte: since } },
    });

    if (recentTokenCount >= MAX_RESENDS_PER_DAY) {
      throw new TooManyRequestsError("Too many resends in 24 hours");
    }

    return iamInviteTokenApi.issueInTx(tx, {
      userId: invitee.id,
      createdByAdminId: userId,
    });
  });

  const expiresInHours = Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / MS_PER_HOUR));

  await sendInvitationEmail({
    userId: invitee.id,
    recipientEmail: invitee.email,
    recipientName: invitee.name,
    plainToken,
    expiresInHours,
  });

  return { expiresAt };
};

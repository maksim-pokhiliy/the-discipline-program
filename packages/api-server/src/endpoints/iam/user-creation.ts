import { UserRole } from "@repo/contracts/iam/auth";
import { type User } from "@repo/contracts/iam/user";

import { type TxClient } from "../../db/tx";
import { mapToUser, ROLE_TO_PRISMA_MAP } from "../../mappers/iam";

import { iamInviteTokenApi } from "./invite-token";
import { sendInvitationEmail } from "./send-invitation-email";

const MS_PER_HOUR = 3_600_000;

type CreatePendingUserInput = {
  email: string;
  name: string | null;
  role: UserRole;
  timezone: string;
};

export const iamUserCreationApi = {
  createPendingUser: async (tx: TxClient, data: CreatePendingUserInput): Promise<User> => {
    const row = await tx.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: ROLE_TO_PRISMA_MAP[data.role],
        timezone: data.timezone,
        password: null,
        emailVerified: null,
      },
    });

    switch (data.role) {
      case UserRole.ATHLETE: {
        await tx.athleteProfile.upsert({
          where: { userId: row.id },
          create: { userId: row.id },
          update: {},
        });
        break;
      }
      case UserRole.COACH:
      case UserRole.HEAD_COACH: {
        await tx.coachProfile.upsert({
          where: { userId: row.id },
          create: { userId: row.id },
          update: { deletedAt: null },
        });
        break;
      }
      case UserRole.ADMIN:
        break;
      default: {
        const exhaustive: never = data.role;

        return exhaustive;
      }
    }

    return mapToUser(row);
  },

  issueInviteAndSendEmail: async (
    actorId: string,
    recipient: { id: string; email: string; name: string | null },
  ): Promise<{ expiresAt: Date }> => {
    const { plainToken, expiresAt } = await iamInviteTokenApi.issue({
      userId: recipient.id,
      createdByAdminId: actorId,
    });

    const expiresInHours = Math.max(
      1,
      Math.round((expiresAt.getTime() - Date.now()) / MS_PER_HOUR),
    );

    await sendInvitationEmail({
      userId: recipient.id,
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      plainToken,
      expiresInHours,
    });

    return { expiresAt };
  },
};

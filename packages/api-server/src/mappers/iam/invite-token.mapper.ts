import { type User as PrismaUser } from "@prisma/client";

import { type InviteToken } from "@repo/contracts/iam/invite-token";

export const mapToInviteToken = (user: PrismaUser, expiresAt: Date): InviteToken => ({
  email: user.email,
  recipientName: user.name,
  expiresAt,
});

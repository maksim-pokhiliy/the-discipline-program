import { invitationEmail } from "@repo/email";
import { baseEnv } from "@repo/env/base";

import {
  resolveEmailConfig,
  type ResolvedEmailConfig,
  sendTransactionalEmail,
} from "../../infrastructure/email/email-sender";

export const resolveInviteEmailConfig = (): ResolvedEmailConfig =>
  resolveEmailConfig({ required: true });

type SendInvitationEmailInput = {
  userId: string;
  recipientEmail: string;
  recipientName: string | null;
  plainToken: string;
  expiresInHours: number;
};

export const sendInvitationEmail = async (input: SendInvitationEmailInput): Promise<void> => {
  const inviteUrl = `${baseEnv.NEXT_PUBLIC_PLATFORM_URL}/invite/${input.plainToken}`;

  await sendTransactionalEmail({
    template: invitationEmail,
    props: {
      inviteUrl,
      recipientName: input.recipientName,
      expiresInHours: input.expiresInHours,
    },
    to: { email: input.recipientEmail },
    required: true,
    logKey: "invite.email",
    logCtx: { userId: input.userId },
  });
};

import { passwordResetEmail } from "@repo/email";
import { baseEnv } from "@repo/env/base";

import { sendTransactionalEmail } from "../../infrastructure/email/email-sender";

type SendPasswordResetEmailInput = {
  userId: string;
  recipientEmail: string;
  recipientName: string | null;
  plainToken: string;
  expiresInHours: number;
};

export const sendPasswordResetEmail = async (input: SendPasswordResetEmailInput): Promise<void> => {
  const resetUrl = `${baseEnv.NEXT_PUBLIC_PLATFORM_URL}/reset-password/${input.plainToken}`;

  await sendTransactionalEmail({
    template: passwordResetEmail,
    props: {
      resetUrl,
      recipientName: input.recipientName,
      expiresInHours: input.expiresInHours,
    },
    to: { email: input.recipientEmail },
    required: true,
    logKey: "password_reset.email",
    logCtx: { userId: input.userId },
  });
};

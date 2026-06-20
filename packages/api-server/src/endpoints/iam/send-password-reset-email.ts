import { createResendEmailService, type EmailPort, renderPasswordResetEmail } from "@repo/email";
import { baseEnv } from "@repo/env/base";
import { emailEnv } from "@repo/env/email";
import { InternalServerError } from "@repo/errors";
import { logger } from "@repo/shared";

type ResetEmailConfig = {
  apiKey: string;
  from: { email: string };
  replyTo?: { email: string };
};

const resolvePasswordResetEmailConfig = (): ResetEmailConfig => {
  const apiKey = emailEnv.RESEND_API_KEY;
  const fromAddress = emailEnv.EMAIL_FROM;

  if (!apiKey || !fromAddress) {
    throw new InternalServerError("RESEND_API_KEY or EMAIL_FROM missing");
  }

  const replyToAddress = emailEnv.EMAIL_REPLY_TO;

  return {
    apiKey,
    from: { email: fromAddress },
    ...(replyToAddress && { replyTo: { email: replyToAddress } }),
  };
};

let cachedService: EmailPort | null = null;
let cachedApiKey: string | null = null;

const getEmailService = (config: ResetEmailConfig): EmailPort => {
  if (cachedService && cachedApiKey === config.apiKey) {
    return cachedService;
  }

  cachedService = createResendEmailService({
    apiKey: config.apiKey,
    defaultFrom: config.from,
    ...(config.replyTo && { defaultReplyTo: config.replyTo }),
  });
  cachedApiKey = config.apiKey;

  return cachedService;
};

type SendPasswordResetEmailInput = {
  userId: string;
  recipientEmail: string;
  recipientName: string | null;
  plainToken: string;
  expiresInHours: number;
};

export const sendPasswordResetEmail = async (input: SendPasswordResetEmailInput): Promise<void> => {
  try {
    const config = resolvePasswordResetEmailConfig();
    const resetUrl = `${baseEnv.NEXT_PUBLIC_PLATFORM_URL}/reset-password/${input.plainToken}`;

    const { html, text } = await renderPasswordResetEmail({
      resetUrl,
      recipientName: input.recipientName,
      expiresInHours: input.expiresInHours,
    });

    const service = getEmailService(config);

    await service.send({
      from: config.from,
      to: { email: input.recipientEmail },
      subject: "Reset your password",
      html,
      text,
      ...(config.replyTo && { replyTo: config.replyTo }),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";

    logger.error("password_reset.email_send_failed", { userId: input.userId, reason });
  }
};

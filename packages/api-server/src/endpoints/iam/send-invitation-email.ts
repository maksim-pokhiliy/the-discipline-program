import { createResendEmailService, type EmailPort, renderInvitationEmail } from "@repo/email";
import { baseEnv } from "@repo/env/base";
import { emailEnv } from "@repo/env/email";
import { InternalServerError } from "@repo/errors";
import { logger } from "@repo/shared";

type InviteEmailConfig = {
  apiKey: string;
  from: { email: string };
  replyTo?: { email: string };
};

export const resolveInviteEmailConfig = (): InviteEmailConfig => {
  const apiKey = emailEnv.RESEND_API_KEY;
  const fromAddress = emailEnv.EMAIL_FROM;

  if (!apiKey || !fromAddress) {
    throw new InternalServerError("Invite flow enabled but RESEND_API_KEY or EMAIL_FROM missing");
  }

  const replyToAddress = emailEnv.EMAIL_REPLY_TO;

  return {
    apiKey,
    from: { email: fromAddress },
    replyTo: replyToAddress ? { email: replyToAddress } : undefined,
  };
};

let cachedService: EmailPort | null = null;
let cachedApiKey: string | null = null;

const getEmailService = (config: InviteEmailConfig): EmailPort => {
  if (cachedService && cachedApiKey === config.apiKey) {
    return cachedService;
  }

  cachedService = createResendEmailService({
    apiKey: config.apiKey,
    defaultFrom: config.from,
    defaultReplyTo: config.replyTo,
  });
  cachedApiKey = config.apiKey;

  return cachedService;
};

type SendInvitationEmailInput = {
  userId: string;
  recipientEmail: string;
  recipientName: string | null;
  plainToken: string;
  expiresInHours: number;
};

export const sendInvitationEmail = async (input: SendInvitationEmailInput): Promise<void> => {
  try {
    const config = resolveInviteEmailConfig();
    const inviteUrl = `${baseEnv.NEXT_PUBLIC_PLATFORM_URL}/invite/${input.plainToken}`;

    const { html, text } = await renderInvitationEmail({
      inviteUrl,
      recipientName: input.recipientName,
      expiresInHours: input.expiresInHours,
    });

    const service = getEmailService(config);

    await service.send({
      from: config.from,
      to: { email: input.recipientEmail },
      subject: "You've been invited",
      html,
      text,
      replyTo: config.replyTo,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";

    logger.error("invite.email_send_failed", { userId: input.userId, reason });
  }
};

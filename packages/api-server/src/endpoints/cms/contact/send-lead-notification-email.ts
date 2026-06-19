import { UserRole } from "@repo/contracts/iam/auth";
import { createResendEmailService, type EmailPort, renderLeadNotificationEmail } from "@repo/email";
import { emailEnv } from "@repo/env/email";
import { logger } from "@repo/shared";

import { prisma } from "../../../db/client";
import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";

type LeadEmailConfig = {
  apiKey: string;
  from: { email: string };
  replyTo?: { email: string };
};

type SendLeadNotificationEmailInput = {
  program: string;
  contact: string;
  message?: string | undefined;
  name?: string | null | undefined;
};

export const resolveLeadEmailConfig = (): LeadEmailConfig | null => {
  const apiKey = emailEnv.RESEND_API_KEY;
  const fromAddress = emailEnv.EMAIL_FROM;

  if (!apiKey || !fromAddress) {
    return null;
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

const getEmailService = (config: LeadEmailConfig): EmailPort => {
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

export const sendLeadNotificationEmail = async (
  input: SendLeadNotificationEmailInput,
): Promise<void> => {
  const headCoach = await prisma.user.findFirst({
    where: { role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] },
  });

  if (!headCoach?.email) {
    logger.info("lead.no_head_coach", { program: input.program });

    return;
  }

  const config = resolveLeadEmailConfig();

  if (config === null) {
    logger.warn("lead.email_config_missing", { program: input.program });

    return;
  }

  try {
    const { html, text } = await renderLeadNotificationEmail({
      program: input.program,
      contact: input.contact,
      recipientName: headCoach.name,
      ...(input.message !== undefined && { message: input.message }),
    });

    const service = getEmailService(config);

    await service.send({
      from: config.from,
      to: { email: headCoach.email },
      subject: "New program lead",
      html,
      text,
      ...(config.replyTo && { replyTo: config.replyTo }),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";

    logger.error("lead.email_send_failed", { program: input.program, reason });
  }
};

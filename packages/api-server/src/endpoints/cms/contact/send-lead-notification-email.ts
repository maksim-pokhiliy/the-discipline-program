import { UserRole } from "@repo/contracts/iam/auth";
import { leadNotificationEmail } from "@repo/email";
import { logger } from "@repo/shared";

import { prisma } from "../../../db/client";
import {
  resolveEmailConfig,
  type ResolvedEmailConfig,
  sendTransactionalEmail,
} from "../../../infrastructure/email/email-sender";
import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";

type SendLeadNotificationEmailInput = {
  program: string;
  contact: string;
  message?: string | undefined;
  name?: string | null | undefined;
};

export const resolveLeadEmailConfig = (): ResolvedEmailConfig | null =>
  resolveEmailConfig({ required: false });

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

  await sendTransactionalEmail({
    template: leadNotificationEmail,
    props: {
      program: input.program,
      contact: input.contact,
      recipientName: headCoach.name,
      ...(input.message !== undefined && { message: input.message }),
    },
    to: { email: headCoach.email },
    required: false,
    logKey: "lead.email",
    logCtx: { program: input.program },
  });
};

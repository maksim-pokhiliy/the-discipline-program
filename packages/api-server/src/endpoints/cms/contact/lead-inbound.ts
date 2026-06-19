import { type ContactSubmissionItem, type CreateLeadSubmission } from "@repo/contracts/cms/contact";
import { logger } from "@repo/shared";

import { prisma } from "../../../db/client";
import { mapToContact } from "../../../mappers/cms";

import { sendLeadNotificationEmail } from "./send-lead-notification-email";

export const cmsLeadInboundApi = {
  createLead: async (data: CreateLeadSubmission): Promise<ContactSubmissionItem> => {
    const submission = await prisma.marketingContactSubmission.create({
      data: {
        contact: data.contact,
        program: data.program,
        message: data.message ?? "",
        ...(data.name !== undefined && { name: data.name }),
      },
    });

    const item = mapToContact(submission);

    try {
      await sendLeadNotificationEmail({
        program: data.program,
        contact: data.contact,
        message: data.message,
        name: data.name,
      });
    } catch (error) {
      logger.error("lead.notify_failed", {
        program: data.program,
        reason: error instanceof Error ? error.message : "unknown error",
      });
    }

    return item;
  },
};

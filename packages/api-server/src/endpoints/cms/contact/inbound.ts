import {
  type ContactSubmissionItem,
  type CreateContactSubmission,
} from "@repo/contracts/cms/contact";

import { prisma } from "../../../db/client";
import { mapToContact } from "../../../mappers/cms";

export const cmsContactInboundApi = {
  createSubmission: async (data: CreateContactSubmission): Promise<ContactSubmissionItem> => {
    const submission = await prisma.marketingContactSubmission.create({
      data: {
        name: data.name,
        contact: data.contact,
        message: data.message,
        ...(data.program !== undefined && { program: data.program }),
      },
    });

    return mapToContact(submission);
  },
};

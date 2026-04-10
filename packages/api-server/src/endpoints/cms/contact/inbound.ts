import {
  type ContactSubmissionItem,
  type CreateContactSubmission,
} from "@repo/contracts/cms/contact";

import { prisma } from "../../../db/client";
import { mapToContact } from "../../../mappers";

export const contactApi = {
  createSubmission: async (data: CreateContactSubmission): Promise<ContactSubmissionItem> => {
    const submission = await prisma.marketingContactSubmission.create({
      data: {
        name: data.name,
        contact: data.contact,
        program: data.program,
        message: data.message,
      },
    });

    return mapToContact(submission);
  },
};

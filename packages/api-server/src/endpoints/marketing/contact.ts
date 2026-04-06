import { type CreateContactSubmission } from "@repo/contracts/contact";

import { prisma } from "../../db/client";

export const contactApi = {
  createSubmission: async (data: CreateContactSubmission) => {
    const submission = await prisma.marketingContactSubmission.create({
      data: {
        name: data.name,
        contact: data.contact,
        program: data.program,
        message: data.message,
      },
    });

    return submission;
  },

  getSubmissions: async () => {
    return prisma.marketingContactSubmission.findMany({
      orderBy: { createdAt: "desc" },
    });
  },
};

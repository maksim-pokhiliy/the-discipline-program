import { type Prisma } from "@prisma/client";

import { prisma } from "../../db/client";

export const contactApi = {
  createSubmission: async (data: Prisma.MarketingContactSubmissionCreateInput) => {
    return prisma.marketingContactSubmission.create({
      data,
    });
  },

  getSubmissions: async () => {
    return prisma.marketingContactSubmission.findMany({
      orderBy: { createdAt: "desc" },
    });
  },
};

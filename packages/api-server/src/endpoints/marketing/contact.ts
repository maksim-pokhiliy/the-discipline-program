import { type CreateContactSubmission } from "@repo/contracts/contact";

import { prisma } from "../../db/client";
import { notificationService } from "../../services";

export const contactApi = {
  createSubmission: async (data: CreateContactSubmission) => {
    const submission = await prisma.marketingContactSubmission.create({
      data: {
        name: data.name,
        email: data.email,
        program: data.program,
        message: data.message,
      },
    });

    notificationService
      .sendContactSubmissionNotification({
        name: submission.name,
        email: submission.email,
        program: submission.program,
        message: submission.message,
      })
      .catch((err) => {
        console.error("Failed to send notification:", err);
      });

    return submission;
  },

  getSubmissions: async () => {
    return prisma.marketingContactSubmission.findMany({
      orderBy: { createdAt: "desc" },
    });
  },
};

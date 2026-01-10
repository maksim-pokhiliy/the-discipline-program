// import { ContactStatus } from "@prisma/client";

export interface ContactSubmissionData {
  name: string;
  email: string;
  program?: string;
  message: string;
}

export const contactApi = {
  createSubmission: async (data: ContactSubmissionData) => {
    // const submission = await prisma.marketingContactSubmission.create({
    //   data: {
    //     name: data.name,
    //     email: data.email,
    //     program: data.program,
    //     message: data.message,
    //     status: ContactStatus.NEW,
    //   },
    // });

    return {
      name: data.name,
      email: data.email,
      program: data.program,
      message: data.message,
      // status: ContactStatus.NEW,
    };

    // return submission;
  },

  getSubmissions: async () => {
    // return prisma.marketingContactSubmission.findMany({
    //   orderBy: { createdAt: "desc" },
    // });

    return [];
  },
};

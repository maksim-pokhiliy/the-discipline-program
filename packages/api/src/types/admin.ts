import { ContactStatus } from "@prisma/client";

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  program?: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
}

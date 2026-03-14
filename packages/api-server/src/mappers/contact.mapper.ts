import { type MarketingContactSubmission as PrismaContact } from "@prisma/client";

import { type GetContactByIdResponse } from "@repo/contracts/contact";

export const mapToContact = (c: PrismaContact): GetContactByIdResponse => ({
  id: c.id,
  name: c.name,
  email: c.email,
  program: c.program,
  message: c.message,
  status: c.status,
  notes: c.notes,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

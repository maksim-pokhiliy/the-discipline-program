import { type MarketingContactSubmission as PrismaContact } from "@prisma/client";

import { type ContactSubmissionItem } from "@repo/contracts/cms/contact";

import { CONTACT_SUBMISSION_STATUS_MAP } from "./enum-maps";

export const mapToContact = (c: PrismaContact): ContactSubmissionItem => ({
  id: c.id,
  name: c.name,
  contact: c.contact,
  program: c.program,
  message: c.message,
  status: CONTACT_SUBMISSION_STATUS_MAP[c.status],
  notes: c.notes,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

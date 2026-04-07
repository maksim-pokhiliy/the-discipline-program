import { type Prisma } from "@prisma/client";

import {
  type AdminContactsPageData,
  type ContactSubmissionItem,
  type UpdateContactRequest,
} from "@repo/contracts/contact";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToContact } from "../../mappers";
import { CONTACT_STATUS_TO_PRISMA_MAP } from "../../mappers/enum-maps";

export const adminContactsApi = {
  getContacts: async (): Promise<ContactSubmissionItem[]> => {
    const contacts = await prisma.marketingContactSubmission.findMany({
      orderBy: { createdAt: "desc" },
    });

    return contacts.map(mapToContact);
  },

  getContactById: async (id: string): Promise<ContactSubmissionItem> => {
    const contact = await prisma.marketingContactSubmission.findUnique({ where: { id } });

    if (!contact) {
      throw new NotFoundError("Contact submission not found", { id });
    }

    return mapToContact(contact);
  },

  updateContact: async (id: string, data: UpdateContactRequest): Promise<ContactSubmissionItem> => {
    const existing = await prisma.marketingContactSubmission.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundError("Contact submission not found", { id });
    }

    const updateData: Prisma.MarketingContactSubmissionUpdateInput = {};

    if (data.status !== undefined) {
      updateData.status = CONTACT_STATUS_TO_PRISMA_MAP[data.status];
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes?.trim() || null;
    }

    const updated = await prisma.marketingContactSubmission.update({
      where: { id },
      data: updateData,
    });

    return mapToContact(updated);
  },

  deleteContact: async (id: string): Promise<void> => {
    const contact = await prisma.marketingContactSubmission.findUnique({ where: { id } });

    if (!contact) {
      throw new NotFoundError("Contact submission not found", { id });
    }

    await prisma.marketingContactSubmission.delete({ where: { id } });
  },

  getContactsPageData: async (): Promise<AdminContactsPageData> => {
    const contacts = await adminContactsApi.getContacts();

    return { contacts };
  },
};

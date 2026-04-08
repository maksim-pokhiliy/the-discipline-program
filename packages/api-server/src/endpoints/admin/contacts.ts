import { type Prisma } from "@prisma/client";

import {
  type AdminContactsPageData,
  type ContactSubmissionItem,
  type UpdateContactRequest,
} from "@repo/contracts/contact";

import { prisma } from "../../db/client";
import { mapToContact } from "../../mappers";
import { CONTACT_STATUS_TO_PRISMA_MAP } from "../../mappers/enum-maps";
import { findOrThrow, handlePrismaError } from "../../utils";

export const adminContactsApi = {
  getContacts: async (): Promise<ContactSubmissionItem[]> => {
    const contacts = await prisma.marketingContactSubmission.findMany({
      orderBy: { createdAt: "desc" },
    });

    return contacts.map(mapToContact);
  },

  getContactById: async (id: string): Promise<ContactSubmissionItem> => {
    const contact = await findOrThrow(
      prisma.marketingContactSubmission.findUnique({ where: { id } }),
      "Contact submission",
    );

    return mapToContact(contact);
  },

  updateContact: async (id: string, data: UpdateContactRequest): Promise<ContactSubmissionItem> => {
    await findOrThrow(
      prisma.marketingContactSubmission.findUnique({ where: { id } }),
      "Contact submission",
    );

    try {
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
    } catch (error) {
      return handlePrismaError(error, { entity: "Contact submission" });
    }
  },

  deleteContact: async (id: string): Promise<void> => {
    await findOrThrow(
      prisma.marketingContactSubmission.findUnique({ where: { id } }),
      "Contact submission",
    );

    try {
      await prisma.marketingContactSubmission.delete({ where: { id } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Contact submission" });
    }
  },

  getContactsPageData: async (): Promise<AdminContactsPageData> => {
    const contacts = await adminContactsApi.getContacts();

    return { contacts };
  },
};

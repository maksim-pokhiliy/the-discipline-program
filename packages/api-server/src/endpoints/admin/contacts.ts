import { type GetContactByIdResponse, type UpdateContactRequest } from "@repo/contracts/contact";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToContact } from "../../mappers";

export const adminContactsApi = {
  getContacts: async (): Promise<GetContactByIdResponse[]> => {
    const contacts = await prisma.marketingContactSubmission.findMany({
      orderBy: { createdAt: "desc" },
    });

    return contacts.map(mapToContact);
  },

  getContactById: async (id: string): Promise<GetContactByIdResponse> => {
    const contact = await prisma.marketingContactSubmission.findUnique({ where: { id } });

    if (!contact) {
      throw new NotFoundError("Contact submission not found", { id });
    }

    return mapToContact(contact);
  },

  updateContact: async (
    id: string,
    data: UpdateContactRequest,
  ): Promise<GetContactByIdResponse> => {
    const existing = await prisma.marketingContactSubmission.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundError("Contact submission not found", { id });
    }

    const updateData: { status?: string; notes?: string | null } = {};

    if (data.status !== undefined) {
      updateData.status = data.status;
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

  getContactsPageData: async () => {
    const contacts = await adminContactsApi.getContacts();

    return { contacts };
  },
};

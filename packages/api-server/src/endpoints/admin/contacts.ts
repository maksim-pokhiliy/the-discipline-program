import {
  type GetContactByIdResponse,
  type UpdateContactRequest,
  CONTACT_STATUS_ENUM,
} from "@repo/contracts/contact";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";

const mapToContact = (c: {
  id: string;
  name: string | null;
  email: string | null;
  program: string | null;
  message: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): GetContactByIdResponse => ({
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

export const adminContactsApi = {
  async getContacts() {
    const contacts = await prisma.marketingContactSubmission.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return contacts.map(mapToContact);
  },

  async getContactById(id: string) {
    const contact = await prisma.marketingContactSubmission.findUnique({ where: { id } });

    if (!contact || contact.deletedAt) {
      throw new NotFoundError("Contact submission not found", { id });
    }

    return mapToContact(contact);
  },

  async updateContact(id: string, data: UpdateContactRequest) {
    const existing = await prisma.marketingContactSubmission.findUnique({ where: { id } });

    if (!existing || existing.deletedAt) {
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

  async deleteContact(id: string) {
    const contact = await prisma.marketingContactSubmission.findUnique({ where: { id } });

    if (!contact || contact.deletedAt) {
      throw new NotFoundError("Contact submission not found", { id });
    }

    await prisma.marketingContactSubmission.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async getContactsPageData() {
    const contacts = await adminContactsApi.getContacts();

    const stats = {
      total: contacts.length,
      new: contacts.filter((c) => c.status === CONTACT_STATUS_ENUM.NEW).length,
      inProgress: contacts.filter((c) => c.status === CONTACT_STATUS_ENUM.IN_PROGRESS).length,
      replied: contacts.filter((c) => c.status === CONTACT_STATUS_ENUM.REPLIED).length,
      closed: contacts.filter((c) => c.status === CONTACT_STATUS_ENUM.CLOSED).length,
    };

    return { stats, contacts };
  },
};

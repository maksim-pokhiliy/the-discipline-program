import { createDeleteHandler, createGetByIdHandler, createPutHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminContactsApi } from "@repo/api-server";
import {
  deleteContactParamsSchema,
  getContactByIdParamsSchema,
  updateContactParamsSchema,
  updateContactRequestSchema,
} from "@repo/contracts/contact";

export const GET = withAdminAuth(
  createGetByIdHandler(adminContactsApi.getContactById, getContactByIdParamsSchema),
);
export const PUT = withAdminAuth(
  createPutHandler(
    adminContactsApi.updateContact,
    updateContactParamsSchema,
    updateContactRequestSchema,
  ),
);
export const DELETE = withAdminAuth(
  createDeleteHandler(adminContactsApi.deleteContact, deleteContactParamsSchema),
);

import { createDeleteHandler, createGetByIdHandler, createPutHandler } from "@repo/api-routes";
import { adminContactsApi } from "@repo/api-server";
import {
  deleteContactParamsSchema,
  getContactByIdParamsSchema,
  updateContactParamsSchema,
  updateContactRequestSchema,
} from "@repo/contracts/cms/contact";

import { withAdminAuth } from "@app/lib/server/auth";

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

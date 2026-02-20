import { adminContactsApi } from "@repo/api-server";
import {
  deleteContactParamsSchema,
  getContactByIdParamsSchema,
  updateContactParamsSchema,
  updateContactRequestSchema,
} from "@repo/contracts/contact";

import { withAdminAuth } from "@app/lib/auth";
import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
} from "@app/lib/route-helpers";

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

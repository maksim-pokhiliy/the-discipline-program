import { adminContactsApi } from "@repo/api-server";
import {
  deleteContactParamsSchema,
  getContactByIdParamsSchema,
  updateContactParamsSchema,
  updateContactRequestSchema,
} from "@repo/contracts/contact";

import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
} from "@app/lib/route-helpers";

export const GET = createGetByIdHandler(
  adminContactsApi.getContactById,
  getContactByIdParamsSchema,
);
export const PUT = createPutHandler(
  adminContactsApi.updateContact,
  updateContactParamsSchema,
  updateContactRequestSchema,
);
export const DELETE = createDeleteHandler(
  adminContactsApi.deleteContact,
  deleteContactParamsSchema,
);

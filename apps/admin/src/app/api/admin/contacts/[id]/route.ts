import { createDeleteHandler, createGetByIdHandler, createPutHandler } from "@repo/api-routes";
import { cmsContactAdminApi } from "@repo/api-server/cms";
import {
  deleteContactParamsSchema,
  getContactByIdParamsSchema,
  updateContactParamsSchema,
  updateContactRequestSchema,
} from "@repo/contracts/cms/contact";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetByIdHandler(cmsContactAdminApi.getContactById, getContactByIdParamsSchema),
);
export const PUT = withAdminAuth(
  createPutHandler(
    cmsContactAdminApi.updateContact,
    updateContactParamsSchema,
    updateContactRequestSchema,
  ),
);
export const DELETE = withAdminAuth(
  createDeleteHandler(cmsContactAdminApi.deleteContact, deleteContactParamsSchema),
);

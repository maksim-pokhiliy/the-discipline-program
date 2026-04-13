import { createDeleteHandler, createGetByIdHandler, createPutHandler } from "@repo/api-routes";
import { cmsContactAdminApi } from "@repo/api-server/cms";
import {
  contactSubmissionItemSchema,
  deleteContactParamsSchema,
  getContactByIdParamsSchema,
  updateContactParamsSchema,
  updateContactRequestSchema,
} from "@repo/contracts/cms/contact";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetByIdHandler(
    cmsContactAdminApi.getContactById,
    getContactByIdParamsSchema,
    contactSubmissionItemSchema,
  ),
);
export const PUT = withAdminAuth(
  createPutHandler(
    cmsContactAdminApi.updateContact,
    updateContactParamsSchema,
    updateContactRequestSchema,
    contactSubmissionItemSchema,
  ),
);
export const DELETE = withAdminAuth(
  createDeleteHandler(cmsContactAdminApi.deleteContact, deleteContactParamsSchema),
);

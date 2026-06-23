import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
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
  withAuthRateLimit(
    createGetByIdHandler(
      cmsContactAdminApi.getContactById,
      getContactByIdParamsSchema,
      contactSubmissionItemSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withAdminAuth(
  withAuthRateLimit(
    createPutHandler(
      cmsContactAdminApi.updateContact,
      updateContactParamsSchema,
      updateContactRequestSchema,
      contactSubmissionItemSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createDeleteHandler(cmsContactAdminApi.deleteContact, deleteContactParamsSchema),
    RATE_LIMIT_TIER.API,
  ),
);

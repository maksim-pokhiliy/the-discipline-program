import { createGetHandler } from "@repo/api-routes";
import { adminContactsApi } from "@repo/api-server/cms";
import { getContactSubmissionsResponseSchema } from "@repo/contracts/cms/contact";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetHandler(adminContactsApi.getContacts, getContactSubmissionsResponseSchema),
);

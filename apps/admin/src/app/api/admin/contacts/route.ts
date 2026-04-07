import { createGetHandler } from "@repo/api-routes";
import { adminContactsApi } from "@repo/api-server";
import { getContactSubmissionsResponseSchema } from "@repo/contracts/contact";

import { withAdminAuth } from "@app/lib/auth";

export const GET = withAdminAuth(
  createGetHandler(adminContactsApi.getContacts, getContactSubmissionsResponseSchema),
);

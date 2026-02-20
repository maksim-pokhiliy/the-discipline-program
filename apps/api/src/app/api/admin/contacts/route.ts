import { adminContactsApi } from "@repo/api-server";
import { getContactSubmissionsResponseSchema } from "@repo/contracts/contact";

import { withAdminAuth } from "@app/lib/auth";
import { createGetHandler } from "@app/lib/route-helpers";

export const GET = withAdminAuth(
  createGetHandler(adminContactsApi.getContacts, getContactSubmissionsResponseSchema),
);

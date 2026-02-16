import { adminContactsApi } from "@repo/api-server";
import { getContactSubmissionsResponseSchema } from "@repo/contracts/contact";

import { createGetHandler } from "@app/lib/route-helpers";

export const GET = createGetHandler(
  adminContactsApi.getContacts,
  getContactSubmissionsResponseSchema,
);

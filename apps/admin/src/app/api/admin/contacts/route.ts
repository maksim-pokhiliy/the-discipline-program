import { createGetHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminContactsApi } from "@repo/api-server";
import { getContactSubmissionsResponseSchema } from "@repo/contracts/contact";

export const GET = withAdminAuth(
  createGetHandler(adminContactsApi.getContacts, getContactSubmissionsResponseSchema),
);

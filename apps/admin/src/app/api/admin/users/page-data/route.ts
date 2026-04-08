import { createGetHandler } from "@repo/api-routes";
import { adminUsersApi } from "@repo/api-server";
import { getUsersPageDataResponseSchema } from "@repo/contracts/user";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetHandler(adminUsersApi.getPageData, getUsersPageDataResponseSchema),
);

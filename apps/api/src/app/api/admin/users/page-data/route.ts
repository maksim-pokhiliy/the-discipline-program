import { adminUsersApi } from "@repo/api-server";
import { getUsersPageDataResponseSchema } from "@repo/contracts/user";

import { withAdminAuth } from "@app/lib/auth";
import { createGetHandler } from "@app/lib/route-helpers";

export const GET = withAdminAuth(
  createGetHandler(adminUsersApi.getPageData, getUsersPageDataResponseSchema),
);

import { createGetHandler } from "@repo/api-routes";
import { adminUsersApi } from "@repo/api-server/iam";
import { getUsersPageDataResponseSchema } from "@repo/contracts/iam/user";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetHandler(adminUsersApi.getPageData, getUsersPageDataResponseSchema),
);

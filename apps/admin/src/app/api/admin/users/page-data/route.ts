import { createGetHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminUsersApi } from "@repo/api-server";
import { getUsersPageDataResponseSchema } from "@repo/contracts/user";

export const GET = withAdminAuth(
  createGetHandler(adminUsersApi.getPageData, getUsersPageDataResponseSchema),
);

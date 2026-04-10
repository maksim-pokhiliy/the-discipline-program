import { createGetHandler } from "@repo/api-routes";
import { iamUserAdminApi } from "@repo/api-server/iam";
import { getUsersPageDataResponseSchema } from "@repo/contracts/iam/user";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetHandler(iamUserAdminApi.getPageData, getUsersPageDataResponseSchema),
);

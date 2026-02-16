import { adminUsersApi } from "@repo/api-server";
import { getUsersPageDataResponseSchema } from "@repo/contracts/user";

import { createGetHandler } from "@app/lib/route-helpers";

export const GET = createGetHandler(adminUsersApi.getPageData, getUsersPageDataResponseSchema);

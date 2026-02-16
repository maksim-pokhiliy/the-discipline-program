import { adminUsersApi } from "@repo/api-server";
import { getUsersResponseSchema } from "@repo/contracts/user";

import { createGetHandler } from "@app/lib/route-helpers";

export const GET = createGetHandler(adminUsersApi.getAll, getUsersResponseSchema);

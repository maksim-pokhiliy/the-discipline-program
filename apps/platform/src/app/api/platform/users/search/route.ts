import { createAuthGetWithQueryHandler } from "@repo/api-routes";
import { platformUsersApi } from "@repo/api-server";
import { searchUsersQuerySchema, searchUsersResponseSchema } from "@repo/contracts/user";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetWithQueryHandler(
    (userId, { q }) => platformUsersApi.search(userId, q),
    searchUsersQuerySchema,
    searchUsersResponseSchema,
  ),
);

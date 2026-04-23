import {
  createAuthGetWithQueryHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { libraryExerciseCoachApi } from "@repo/api-server/library";
import {
  getExercisesQuerySchema,
  getMyExercisesResponseSchema,
} from "@repo/contracts/library/exercise";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      (userId, query) =>
        libraryExerciseCoachApi.listMine({
          userId,
          statusFilter: query.status,
          search: query.search,
          page: query.page,
          limit: query.limit,
        }),
      getExercisesQuerySchema,
      getMyExercisesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

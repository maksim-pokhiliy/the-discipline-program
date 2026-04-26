import {
  createAuthGetWithQueryHandler,
  createAuthPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsExerciseLibraryItemApi } from "@repo/api-server/lms/exercise-library-item";
import {
  createExerciseLibraryItemInputSchema,
  createExerciseLibraryItemResponseSchema,
  listExerciseLibraryItemsQuerySchema,
  listExerciseLibraryItemsResponseSchema,
} from "@repo/contracts/lms/exercise-library-item";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      lmsExerciseLibraryItemApi.list,
      listExerciseLibraryItemsQuerySchema,
      listExerciseLibraryItemsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withAdminAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      lmsExerciseLibraryItemApi.create,
      createExerciseLibraryItemInputSchema,
      createExerciseLibraryItemResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

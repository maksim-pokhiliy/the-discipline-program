import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsExerciseLibraryItemApi } from "@repo/api-server/lms/exercise-library-item";
import { idParamSchema } from "@repo/contracts/common";
import {
  getExerciseLibraryItemResponseSchema,
  updateExerciseLibraryItemInputSchema,
  updateExerciseLibraryItemResponseSchema,
} from "@repo/contracts/lms/exercise-library-item";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (actorId, { id }) => lmsExerciseLibraryItemApi.getById(actorId, id),
      idParamSchema,
      getExerciseLibraryItemResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withAdminAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (actorId, { id }, data) => lmsExerciseLibraryItemApi.update(actorId, id, data),
      idParamSchema,
      updateExerciseLibraryItemInputSchema,
      updateExerciseLibraryItemResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (actorId, { id }) => lmsExerciseLibraryItemApi.delete(actorId, id),
      idParamSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

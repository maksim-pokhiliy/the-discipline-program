import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { libraryExerciseCoachApi } from "@repo/api-server/library";
import {
  deleteExerciseParamsSchema,
  getExerciseByIdParamsSchema,
  getExerciseResponseSchema,
  updateExerciseParamsSchema,
  updateExerciseRequestSchema,
  updateExerciseResponseSchema,
} from "@repo/contracts/library/exercise";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { id }) => libraryExerciseCoachApi.getById({ userId, id }),
      getExerciseByIdParamsSchema,
      getExerciseResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { id }, data) => libraryExerciseCoachApi.update({ userId, id, input: data }),
      updateExerciseParamsSchema,
      updateExerciseRequestSchema,
      updateExerciseResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { id }) => libraryExerciseCoachApi.delete({ userId, id }),
      deleteExerciseParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

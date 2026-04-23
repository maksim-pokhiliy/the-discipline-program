import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { libraryExerciseAdminApi } from "@repo/api-server/library";
import {
  deleteExerciseParamsSchema,
  getExerciseByIdParamsSchema,
  getExerciseResponseSchema,
  updateExerciseParamsSchema,
  updateExerciseRequestSchema,
  updateExerciseResponseSchema,
} from "@repo/contracts/library/exercise";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (_actorId, { id }) => libraryExerciseAdminApi.getById(id),
      getExerciseByIdParamsSchema,
      getExerciseResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withAdminAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (_actorId, { id }, data) => libraryExerciseAdminApi.update({ id, input: data }),
      updateExerciseParamsSchema,
      updateExerciseRequestSchema,
      updateExerciseResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (_actorId, { id }) => libraryExerciseAdminApi.delete(id),
      deleteExerciseParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

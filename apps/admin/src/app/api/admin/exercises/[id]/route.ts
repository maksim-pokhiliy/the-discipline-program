import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsExerciseAdminApi } from "@repo/api-server/lms";
import {
  deleteExerciseParamsSchema,
  getExerciseByIdParamsSchema,
  getExerciseResponseSchema,
  updateExerciseParamsSchema,
  updateExerciseRequestSchema,
  updateExerciseResponseSchema,
} from "@repo/contracts/lms/exercise";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetByIdHandler(
      lmsExerciseAdminApi.getExerciseById,
      getExerciseByIdParamsSchema,
      getExerciseResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
export const PUT = withAdminAuth(
  withAuthRateLimit(
    createPutHandler(
      lmsExerciseAdminApi.updateExercise,
      updateExerciseParamsSchema,
      updateExerciseRequestSchema,
      updateExerciseResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createDeleteHandler(lmsExerciseAdminApi.deleteExercise, deleteExerciseParamsSchema),
    RATE_LIMIT_TIER.API,
  ),
);

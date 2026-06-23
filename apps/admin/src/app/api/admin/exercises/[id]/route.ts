import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsExerciseAdminApi } from "@repo/api-server/lms";
import {
  deleteExerciseParamsSchema,
  exerciseSchema,
  getExerciseByIdParamsSchema,
  updateExerciseParamsSchema,
  updateExerciseRequestSchema,
} from "@repo/contracts/lms/exercise";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetByIdHandler(
      cmsExerciseAdminApi.getExerciseById,
      getExerciseByIdParamsSchema,
      exerciseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withAdminAuth(
  withAuthRateLimit(
    createPutHandler(
      cmsExerciseAdminApi.updateExercise,
      updateExerciseParamsSchema,
      updateExerciseRequestSchema,
      exerciseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createDeleteHandler(cmsExerciseAdminApi.deleteExercise, deleteExerciseParamsSchema),
    RATE_LIMIT_TIER.API,
  ),
);

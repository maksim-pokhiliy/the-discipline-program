import { adminExercisesApi } from "@repo/api-server";
import {
  deleteExerciseParamsSchema,
  getExerciseByIdParamsSchema,
  updateExerciseParamsSchema,
  updateExerciseRequestSchema,
} from "@repo/contracts/exercise";

import { withAdminAuth } from "@app/lib/auth";
import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
} from "@app/lib/route-helpers";

export const GET = withAdminAuth(
  createGetByIdHandler(adminExercisesApi.getById, getExerciseByIdParamsSchema),
);
export const PUT = withAdminAuth(
  createPutHandler(
    adminExercisesApi.update,
    updateExerciseParamsSchema,
    updateExerciseRequestSchema,
  ),
);
export const DELETE = withAdminAuth(
  createDeleteHandler(adminExercisesApi.delete, deleteExerciseParamsSchema),
);

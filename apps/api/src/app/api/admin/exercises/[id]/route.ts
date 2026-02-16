import { adminExercisesApi } from "@repo/api-server";
import {
  deleteExerciseParamsSchema,
  getExerciseByIdParamsSchema,
  updateExerciseParamsSchema,
  updateExerciseRequestSchema,
} from "@repo/contracts/exercise";

import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
} from "@app/lib/route-helpers";

export const GET = createGetByIdHandler(adminExercisesApi.getById, getExerciseByIdParamsSchema);
export const PUT = createPutHandler(
  adminExercisesApi.update,
  updateExerciseParamsSchema,
  updateExerciseRequestSchema,
);
export const DELETE = createDeleteHandler(adminExercisesApi.delete, deleteExerciseParamsSchema);

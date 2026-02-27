import { createDeleteHandler, createGetByIdHandler, createPutHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminExercisesApi } from "@repo/api-server";
import {
  deleteExerciseParamsSchema,
  getExerciseByIdParamsSchema,
  updateExerciseParamsSchema,
  updateExerciseRequestSchema,
} from "@repo/contracts/exercise";

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

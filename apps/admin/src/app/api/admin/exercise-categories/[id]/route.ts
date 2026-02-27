import { createDeleteHandler, createPutHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminExerciseCategoriesApi } from "@repo/api-server";
import {
  deleteExerciseCategoryParamsSchema,
  updateExerciseCategoryParamsSchema,
  updateExerciseCategoryRequestSchema,
} from "@repo/contracts/exercise-category";

export const PUT = withAdminAuth(
  createPutHandler(
    adminExerciseCategoriesApi.update,
    updateExerciseCategoryParamsSchema,
    updateExerciseCategoryRequestSchema,
  ),
);
export const DELETE = withAdminAuth(
  createDeleteHandler(adminExerciseCategoriesApi.delete, deleteExerciseCategoryParamsSchema),
);

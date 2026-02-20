import { adminExerciseCategoriesApi } from "@repo/api-server";
import {
  deleteExerciseCategoryParamsSchema,
  updateExerciseCategoryParamsSchema,
  updateExerciseCategoryRequestSchema,
} from "@repo/contracts/exercise-category";

import { withAdminAuth } from "@app/lib/auth";
import { createDeleteHandler, createPutHandler } from "@app/lib/route-helpers";

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

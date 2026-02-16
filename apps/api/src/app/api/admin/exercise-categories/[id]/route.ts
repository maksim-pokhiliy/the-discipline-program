import { adminExerciseCategoriesApi } from "@repo/api-server";
import {
  deleteExerciseCategoryParamsSchema,
  updateExerciseCategoryParamsSchema,
  updateExerciseCategoryRequestSchema,
} from "@repo/contracts/exercise-category";

import { createDeleteHandler, createPutHandler } from "@app/lib/route-helpers";

export const PUT = createPutHandler(
  adminExerciseCategoriesApi.update,
  updateExerciseCategoryParamsSchema,
  updateExerciseCategoryRequestSchema,
);
export const DELETE = createDeleteHandler(
  adminExerciseCategoriesApi.delete,
  deleteExerciseCategoryParamsSchema,
);

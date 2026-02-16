import { adminExerciseCategoriesApi } from "@repo/api-server";
import {
  createExerciseCategoryRequestSchema,
  getExerciseCategoriesResponseSchema,
} from "@repo/contracts/exercise-category";

import { createGetHandler, createPostHandler } from "@app/lib/route-helpers";

export const GET = createGetHandler(
  adminExerciseCategoriesApi.getAll,
  getExerciseCategoriesResponseSchema,
);
export const POST = createPostHandler(
  adminExerciseCategoriesApi.create,
  createExerciseCategoryRequestSchema,
);

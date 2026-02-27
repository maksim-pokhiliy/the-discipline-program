import { createGetHandler, createPostHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminExerciseCategoriesApi } from "@repo/api-server";
import {
  createExerciseCategoryRequestSchema,
  getExerciseCategoriesResponseSchema,
} from "@repo/contracts/exercise-category";

export const GET = withAdminAuth(
  createGetHandler(adminExerciseCategoriesApi.getAll, getExerciseCategoriesResponseSchema),
);
export const POST = withAdminAuth(
  createPostHandler(adminExerciseCategoriesApi.create, createExerciseCategoryRequestSchema),
);

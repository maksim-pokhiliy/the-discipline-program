import { adminExerciseCategoriesApi } from "@repo/api-server";
import {
  createExerciseCategoryRequestSchema,
  getExerciseCategoriesResponseSchema,
} from "@repo/contracts/exercise-category";

import { withAdminAuth } from "@app/lib/auth";
import { createGetHandler, createPostHandler } from "@app/lib/route-helpers";

export const GET = withAdminAuth(
  createGetHandler(adminExerciseCategoriesApi.getAll, getExerciseCategoriesResponseSchema),
);
export const POST = withAdminAuth(
  createPostHandler(adminExerciseCategoriesApi.create, createExerciseCategoryRequestSchema),
);

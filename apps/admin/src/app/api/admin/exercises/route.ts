import { createGetHandler, createPostHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminExercisesApi } from "@repo/api-server";
import { createExerciseRequestSchema, getExercisesResponseSchema } from "@repo/contracts/exercise";

export const GET = withAdminAuth(
  createGetHandler(adminExercisesApi.getAll, getExercisesResponseSchema),
);
export const POST = withAdminAuth(
  createPostHandler(adminExercisesApi.create, createExerciseRequestSchema),
);

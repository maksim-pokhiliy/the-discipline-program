import { adminExercisesApi } from "@repo/api-server";
import { createExerciseRequestSchema, getExercisesResponseSchema } from "@repo/contracts/exercise";

import { withAdminAuth } from "@app/lib/auth";
import { createGetHandler, createPostHandler } from "@app/lib/route-helpers";

export const GET = withAdminAuth(
  createGetHandler(adminExercisesApi.getAll, getExercisesResponseSchema),
);
export const POST = withAdminAuth(
  createPostHandler(adminExercisesApi.create, createExerciseRequestSchema),
);

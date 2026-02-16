import { adminExercisesApi } from "@repo/api-server";
import { createExerciseRequestSchema, getExercisesResponseSchema } from "@repo/contracts/exercise";

import { createGetHandler, createPostHandler } from "@app/lib/route-helpers";

export const GET = createGetHandler(adminExercisesApi.getAll, getExercisesResponseSchema);
export const POST = createPostHandler(adminExercisesApi.create, createExerciseRequestSchema);

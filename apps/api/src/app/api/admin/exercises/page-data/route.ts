import { adminExercisesApi } from "@repo/api-server";
import { getExercisesPageDataResponseSchema } from "@repo/contracts/exercise";

import { createGetHandler } from "@app/lib/route-helpers";

export const GET = createGetHandler(
  adminExercisesApi.getPageData,
  getExercisesPageDataResponseSchema,
);

import { adminExercisesApi } from "@repo/api-server";
import { getExercisesPageDataResponseSchema } from "@repo/contracts/exercise";

import { withAdminAuth } from "@app/lib/auth";
import { createGetHandler } from "@app/lib/route-helpers";

export const GET = withAdminAuth(
  createGetHandler(adminExercisesApi.getPageData, getExercisesPageDataResponseSchema),
);

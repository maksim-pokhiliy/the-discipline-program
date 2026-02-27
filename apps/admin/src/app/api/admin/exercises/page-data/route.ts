import { createGetHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminExercisesApi } from "@repo/api-server";
import { getExercisesPageDataResponseSchema } from "@repo/contracts/exercise";

export const GET = withAdminAuth(
  createGetHandler(adminExercisesApi.getPageData, getExercisesPageDataResponseSchema),
);

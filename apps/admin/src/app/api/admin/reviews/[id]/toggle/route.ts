import { createToggleHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminReviewsApi } from "@repo/api-server";
import { toggleReviewParamsSchema } from "@repo/contracts/review";

export const PATCH = withAdminAuth(
  createToggleHandler(adminReviewsApi.toggleReviewStatus, toggleReviewParamsSchema),
);

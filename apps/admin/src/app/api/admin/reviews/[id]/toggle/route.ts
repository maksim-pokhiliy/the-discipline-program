import { createToggleHandler } from "@repo/api-routes";
import { cmsReviewAdminApi } from "@repo/api-server/cms";
import { toggleReviewParamsSchema } from "@repo/contracts/cms/review";

import { withAdminAuth } from "@app/lib/server/auth";

export const PATCH = withAdminAuth(
  createToggleHandler(cmsReviewAdminApi.toggleReviewStatus, toggleReviewParamsSchema),
);

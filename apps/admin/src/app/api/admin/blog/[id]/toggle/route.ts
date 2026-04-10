import { createMultiToggleHandler } from "@repo/api-routes";
import { adminBlogApi } from "@repo/api-server/cms";
import {
  BlogToggleField,
  toggleBlogPostParamsSchema,
  toggleBlogPostQuerySchema,
} from "@repo/contracts/cms/blog";

import { withAdminAuth } from "@app/lib/server/auth";

export const PATCH = withAdminAuth(
  createMultiToggleHandler(
    {
      [BlogToggleField.IS_PUBLISHED]: adminBlogApi.toggleBlogPostStatus,
      [BlogToggleField.IS_FEATURED]: adminBlogApi.toggleBlogPostFeatured,
    },
    toggleBlogPostParamsSchema,
    toggleBlogPostQuerySchema,
  ),
);

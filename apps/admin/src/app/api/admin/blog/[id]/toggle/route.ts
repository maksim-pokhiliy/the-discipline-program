import { createMultiToggleHandler } from "@repo/api-routes";
import { cmsBlogAdminApi } from "@repo/api-server/cms";
import {
  BlogToggleField,
  blogPostSchema,
  toggleBlogPostParamsSchema,
  toggleBlogPostQuerySchema,
} from "@repo/contracts/cms/blog";

import { withAdminAuth } from "@app/lib/server/auth";

export const PATCH = withAdminAuth(
  createMultiToggleHandler(
    {
      [BlogToggleField.IS_PUBLISHED]: cmsBlogAdminApi.toggleBlogPostStatus,
      [BlogToggleField.IS_FEATURED]: cmsBlogAdminApi.toggleBlogPostFeatured,
    },
    toggleBlogPostParamsSchema,
    toggleBlogPostQuerySchema,
    blogPostSchema,
  ),
);

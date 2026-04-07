import { createMultiToggleHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminBlogApi } from "@repo/api-server";
import {
  BlogToggleField,
  toggleBlogPostParamsSchema,
  toggleBlogPostQuerySchema,
} from "@repo/contracts/blog";

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

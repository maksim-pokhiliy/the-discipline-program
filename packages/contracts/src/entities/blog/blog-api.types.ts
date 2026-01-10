import { type z } from "zod";

import {
  type getBlogPostsResponseSchema,
  type getBlogPostByIdParamsSchema,
  type createBlogPostRequestSchema,
  type updateBlogPostParamsSchema,
  type updateBlogPostRequestSchema,
  type deleteBlogPostParamsSchema,
  type toggleBlogPostParamsSchema,
  type toggleBlogPostQuerySchema,
  type getBlogPageDataResponseSchema,
  type getBlogArticleBySlugParamsSchema,
} from "./blog-api.schema";

export type GetBlogPostsResponse = z.infer<typeof getBlogPostsResponseSchema>;

export type GetBlogPostByIdParams = z.infer<typeof getBlogPostByIdParamsSchema>;

export type CreateBlogPostRequest = z.infer<typeof createBlogPostRequestSchema>;

export type UpdateBlogPostParams = z.infer<typeof updateBlogPostParamsSchema>;

export type UpdateBlogPostRequest = z.infer<typeof updateBlogPostRequestSchema>;

export type DeleteBlogPostParams = z.infer<typeof deleteBlogPostParamsSchema>;

export type ToggleBlogPostParams = z.infer<typeof toggleBlogPostParamsSchema>;

export type ToggleBlogPostQuery = z.infer<typeof toggleBlogPostQuerySchema>;

export type GetBlogPageDataResponse = z.infer<typeof getBlogPageDataResponseSchema>;

export type GetBlogArticleBySlugParams = z.infer<typeof getBlogArticleBySlugParamsSchema>;

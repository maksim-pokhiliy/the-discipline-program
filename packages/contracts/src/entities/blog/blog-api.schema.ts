import { z } from "zod";

import { idParamSchema } from "../../common";

import { BlogToggleField } from "./blog.constants";
import { blogPostSchema, createBlogPostSchema, updateBlogPostSchema } from "./blog.schema";

export const getBlogPostsResponseSchema = z.array(blogPostSchema);

export const getBlogPostByIdParamsSchema = idParamSchema;

export const createBlogPostRequestSchema = createBlogPostSchema;

export const updateBlogPostParamsSchema = idParamSchema;

export const updateBlogPostRequestSchema = updateBlogPostSchema;

export const deleteBlogPostParamsSchema = idParamSchema;

export const toggleBlogPostParamsSchema = idParamSchema;

export const toggleBlogPostQuerySchema = z.object({
  field: z.nativeEnum(BlogToggleField),
});

export const getBlogPageDataResponseSchema = z.object({
  posts: getBlogPostsResponseSchema,
});

export const getBlogArticleBySlugParamsSchema = z.object({
  articleSlug: z.string().min(1),
});

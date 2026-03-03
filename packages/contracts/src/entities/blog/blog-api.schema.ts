import { z } from "zod";

import { BlogToggleField } from "./blog.constants";
import { blogPostSchema, createBlogPostSchema, updateBlogPostSchema } from "./blog.schema";

export const getBlogPostsResponseSchema = z.array(blogPostSchema);

export const getBlogPostByIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const createBlogPostRequestSchema = createBlogPostSchema;

export const updateBlogPostParamsSchema = z.object({
  id: z.string().cuid(),
});

export const updateBlogPostRequestSchema = updateBlogPostSchema;

export const deleteBlogPostParamsSchema = z.object({
  id: z.string().cuid(),
});

export const toggleBlogPostParamsSchema = z.object({
  id: z.string().cuid(),
});

export const toggleBlogPostQuerySchema = z.object({
  field: z.nativeEnum(BlogToggleField),
});

export const getBlogPageDataResponseSchema = z.object({
  posts: getBlogPostsResponseSchema,
});

export const getBlogArticleBySlugParamsSchema = z.object({
  articleSlug: z.string().min(1),
});

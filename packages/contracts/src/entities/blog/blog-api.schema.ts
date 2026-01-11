import { z } from "zod";

import { BLOG_TOGGLE_FIELDS } from "./blog.constants";
import { blogPostSchema, createBlogPostSchema, updateBlogPostSchema } from "./blog.schema";

export const getBlogPostsResponseSchema = z.array(blogPostSchema);

export const getBlogPostByIdParamsSchema = z
  .object({
    id: z.string().cuid(),
  })
  .strict();

export const createBlogPostRequestSchema = createBlogPostSchema;

export const updateBlogPostParamsSchema = z
  .object({
    id: z.string().cuid(),
  })
  .strict();

export const updateBlogPostRequestSchema = updateBlogPostSchema;

export const deleteBlogPostParamsSchema = z
  .object({
    id: z.string().cuid(),
  })
  .strict();

export const toggleBlogPostParamsSchema = z
  .object({
    id: z.string().cuid(),
  })
  .strict();

export const toggleBlogPostQuerySchema = z
  .object({
    field: z.enum(BLOG_TOGGLE_FIELDS),
  })
  .strict();

export const getBlogPageDataResponseSchema = z
  .object({
    stats: z
      .object({
        total: z.number(),
        published: z.number(),
        drafts: z.number(),
        featured: z.number(),
      })
      .strict(),
    posts: getBlogPostsResponseSchema,
  })
  .strict();

export const getBlogArticleBySlugParamsSchema = z
  .object({
    articleSlug: z.string().min(1),
  })
  .strict();

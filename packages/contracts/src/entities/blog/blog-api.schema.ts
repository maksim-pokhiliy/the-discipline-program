import { z } from "zod";

import { BLOG_TOGGLE_FIELDS } from "./blog.constants";
import {
  createBlogPostSchema,
  updateBlogPostSchema,
  updateBlogPostsOrderSchema,
} from "./blog.schema";

export const getBlogPostsResponseSchema = z.array(
  z
    .object({
      id: z.string(),
      title: z.string(),
      slug: z.string(),
      excerpt: z.string(),
      content: z.string(),
      coverImage: z.string().nullable(),
      author: z.string(),
      publishedAt: z.date().nullable(),
      readTime: z.number().nullable(),
      category: z.string(),
      tags: z.array(z.string()),
      isPublished: z.boolean(),
      isFeatured: z.boolean(),
      sortOrder: z.number(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })
    .strict(),
);

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

export const updateBlogPostsOrderRequestSchema = updateBlogPostsOrderSchema;

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

export const publicBlogPostSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    excerpt: z.string(),
    content: z.string(),
    coverImage: z.string(),
    author: z.string(),
    publishedAt: z.date(),
    readTime: z.number().nullable(),
    category: z.string(),
    tags: z.array(z.string()),
  })
  .strict();

export const publicBlogPostPreviewSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    excerpt: z.string(),
    coverImage: z.string(),
    category: z.string(),
    publishedAt: z.date(),
    readTime: z.number().nullable(),
  })
  .strict();

import { z } from "zod";
import {
  createBlogPostSchema,
  updateBlogPostSchema,
  updateBlogPostsOrderSchema,
} from "./blog.schema";

export const getBlogPostsResponseSchema = z.array(
  z.object({
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
  }),
);

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
  field: z.enum(["isPublished", "isFeatured"]),
});

export const updateBlogPostsOrderRequestSchema = updateBlogPostsOrderSchema;

export const getBlogPageDataResponseSchema = z.object({
  stats: z.object({
    total: z.number(),
    published: z.number(),
    drafts: z.number(),
    featured: z.number(),
  }),
  posts: getBlogPostsResponseSchema,
});

export const getBlogArticleBySlugParamsSchema = z.object({
  articleSlug: z.string().min(1),
});

export const getBlogArticleResponseSchema = z.object({
  post: z.object({
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
  }),
  relatedPosts: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      slug: z.string(),
      excerpt: z.string(),
      coverImage: z.string().nullable(),
      category: z.string(),
      publishedAt: z.date().nullable(),
    }),
  ),
});

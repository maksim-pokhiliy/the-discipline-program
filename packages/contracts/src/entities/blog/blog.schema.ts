import { z } from "zod";

export const blogPostSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  excerpt: z.string().min(1).max(500),
  content: z.string().min(1),
  coverImage: z.string().url().nullable(),
  author: z.string().min(1).max(100),
  publishedAt: z.date().nullable(),
  readTime: z.number().int().positive().nullable(),
  category: z.string().min(1).max(50),
  tags: z.array(z.string()),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBlogPostSchema = blogPostSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

export const updateBlogPostOrderSchema = z.object({
  id: z.string().cuid(),
  sortOrder: z.number().int().min(0),
});

export const updateBlogPostsOrderSchema = z.array(updateBlogPostOrderSchema);

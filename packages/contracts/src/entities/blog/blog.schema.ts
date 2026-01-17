import { z } from "zod";

export const blogPostSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().min(1).max(500).nullable(),
  content: z.string().min(1),
  coverImage: z.string().nullable(),
  publishedAt: z.date().nullable(),
  readTime: z.number().int().positive().nullable(),
  authorName: z.string().min(1, "Author name is required"),
  category: z.string().default("Uncategorized"),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBlogPostSchema = blogPostSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

export const publicBlogPostSchema = z.object({
  id: z.string().cuid(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable(),
  content: z.string(),
  coverImage: z.string().nullable(),
  publishedAt: z.date(),
  readTime: z.number().nullable(),
  isFeatured: z.boolean(),
  authorName: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
});

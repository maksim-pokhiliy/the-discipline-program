// packages/contracts/src/entities/blog/blog.schema.ts
import { z } from "zod";

export const blogPostSchema = z
  .object({
    id: z.string().cuid(),
    title: z.string().min(1).max(200),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    excerpt: z.string().min(1).max(500).nullable(),
    content: z.string().min(1),
    coverImage: z.string().nullable(),
    authorName: z.string().min(1).max(100).nullable(),
    publishedAt: z.date().nullable(),
    readTime: z.number().int().positive().nullable(),
    isPublished: z.boolean(),
    isFeatured: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

export const createBlogPostSchema = blogPostSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

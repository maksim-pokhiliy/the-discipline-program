import { z } from "zod";

import { BlogCategory, BLOG_CONSTANTS } from "./blog.constants";

export const blogPostSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/),
  excerpt: z.string().max(500).nullable(),
  content: z.string().min(BLOG_CONSTANTS.MIN_CONTENT_LENGTH),
  coverImage: z.string().nullable(),
  publishedAt: z.coerce.date().nullable(),
  readTime: z.number().int().nonnegative().nullable(),
  authorName: z.string().min(1, "Author name is required"),
  category: z.nativeEnum(BlogCategory).default(BlogCategory.UNCATEGORIZED),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const createBlogPostBaseSchema = blogPostSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createBlogPostSchema = createBlogPostBaseSchema.transform((data) => ({
  ...data,
  excerpt: data.excerpt === "" ? null : data.excerpt,
}));

export const updateBlogPostSchema = createBlogPostBaseSchema.partial();

export const publicBlogPostSchema = z.object({
  id: z.string().cuid(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable(),
  content: z.string(),
  coverImage: z.string().nullable(),
  publishedAt: z.coerce.date(),
  readTime: z.number().nullable(),
  isFeatured: z.boolean(),
  authorName: z.string(),
  category: z.nativeEnum(BlogCategory),
  tags: z.array(z.string()),
});

export const publicBlogPostPreviewSchema = publicBlogPostSchema.pick({
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  publishedAt: true,
  readTime: true,
  category: true,
  tags: true,
});

export const blogLabelsSchema = z.object({
  readMoreLabel: z.string(),
  minReadSuffix: z.string(),
  readArticleLabel: z.string(),
});

export const blogPostPageDataSchema = z.object({
  post: publicBlogPostSchema,
  relatedPosts: z.array(publicBlogPostPreviewSchema),
  relatedSectionTitle: z.string(),
  labels: blogLabelsSchema,
});

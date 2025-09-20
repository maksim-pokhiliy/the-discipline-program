"use client";

import { z } from "zod";

export const blogFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title is too long"),

  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(200, "Slug is too long")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),

  excerpt: z.string().max(300, "Excerpt must be less than 300 characters"),

  content: z
    .string()
    .min(100, "Content must be at least 100 characters")
    .max(50000, "Content is too long"),

  coverImage: z.union([z.string().url("Must be a valid URL"), z.literal(""), z.null()]),

  author: z.string().min(1, "Author is required"),

  category: z.string().min(1, "Category is required"),

  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed"),

  isPublished: z.boolean(),

  isFeatured: z.boolean(),

  sortOrder: z
    .number()
    .min(0, "Sort order cannot be negative")
    .int("Sort order must be a whole number"),
});

export type BlogFormSchema = z.infer<typeof blogFormSchema>;

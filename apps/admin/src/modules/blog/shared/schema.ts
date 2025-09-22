"use client";

import { z } from "zod";

export const blogFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(150, "Title is too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .max(100, "Slug is too long"),
  excerpt: z
    .string()
    .min(20, "Excerpt must be at least 20 characters")
    .max(300, "Excerpt is too long"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  coverImage: z.union([z.string().url("Cover image must be a valid URL"), z.literal(""), z.null()]),
  author: z.string().min(1, "Author is required").max(100, "Author name is too long"),
  category: z.string().min(1, "Category is required").max(100, "Category is too long"),
  tags: z.array(z.string().min(1, "Tag cannot be empty")).default([]),
  readTime: z
    .union([
      z
        .number({ invalid_type_error: "Read time must be a number" })
        .min(1, "Read time must be at least 1 minute")
        .max(240, "Read time must be less than 4 hours"),
      z.null(),
    ])
    .default(null),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z
    .number({ invalid_type_error: "Sort order must be a number" })
    .min(0, "Sort order cannot be negative")
    .int("Sort order must be a whole number"),
  publishedAt: z
    .union([z.string(), z.null()])
    .transform((value) => {
      if (!value || value === "") {
        return null;
      }

      return value;
    })
    .refine(
      (value) => value === null || !Number.isNaN(new Date(value).getTime()),
      "Publish date must be a valid date",
    ),
});

export type BlogFormSchema = z.infer<typeof blogFormSchema>;
export type BlogFormSchemaInput = z.input<typeof blogFormSchema>;

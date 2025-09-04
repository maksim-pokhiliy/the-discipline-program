"use client";

import { z } from "zod";

export const reviewFormSchema = z.object({
  authorName: z.string().min(1, "Author name is required").max(100, "Name is too long"),

  authorRole: z.string().min(1, "Author role is required").max(100, "Role is too long"),

  authorAvatar: z.string().url("Must be a valid URL").optional().or(z.literal("")),

  text: z
    .string()
    .min(10, "Review text must be at least 10 characters")
    .max(1000, "Review text is too long"),

  rating: z
    .number()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5")
    .int("Rating must be a whole number"),

  programId: z.string().optional().nullable(),

  isActive: z.boolean(),

  isFeatured: z.boolean(),

  sortOrder: z
    .number()
    .min(0, "Sort order cannot be negative")
    .int("Sort order must be a whole number"),
});

export type ReviewFormSchema = z.infer<typeof reviewFormSchema>;

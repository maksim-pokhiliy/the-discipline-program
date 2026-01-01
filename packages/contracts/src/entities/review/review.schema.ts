import { z } from "zod";

export const reviewSchema = z.object({
  id: z.string().cuid(),
  text: z.string().min(1),
  authorName: z.string().min(1).max(100),
  authorRole: z.string().min(1).max(100),
  authorAvatar: z.string().url().nullable(),
  rating: z.number().int().min(1).max(5),
  programId: z.string().cuid().nullable(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createReviewSchema = reviewSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateReviewSchema = createReviewSchema.partial();

export const updateReviewOrderSchema = z.object({
  id: z.string().cuid(),
  sortOrder: z.number().int().min(0),
});

export const updateReviewsOrderSchema = z.array(updateReviewOrderSchema);

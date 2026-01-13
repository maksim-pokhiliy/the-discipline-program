import { z } from "zod";

export const reviewSchema = z.object({
  id: z.string().cuid(),
  authorName: z.string().min(1),
  authorRole: z.string().min(1).nullable(),
  authorAvatar: z.string().nullable(),
  text: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createReviewSchema = reviewSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateReviewSchema = createReviewSchema.partial();

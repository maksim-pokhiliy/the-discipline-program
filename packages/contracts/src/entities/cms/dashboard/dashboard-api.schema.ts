import { z } from "zod";

import { DashboardActivityType } from "./dashboard.constants";

export const activityItemSchema = z.object({
  id: z.string().cuid(),
  type: z.nativeEnum(DashboardActivityType),
  title: z.string(),
  subtitle: z.string().nullable(),
  date: z.date(),
  rating: z.number().finite().optional(),
  href: z.string(),
});

export const getDashboardDataResponseSchema = z.object({
  contentStats: z.object({
    products: z.object({
      total: z.number().int().nonnegative(),
      active: z.number().int().nonnegative(),
      inactive: z.number().int().nonnegative(),
    }),
    reviews: z.object({
      total: z.number().int().nonnegative(),
      active: z.number().int().nonnegative(),
    }),
    blogPosts: z.object({
      total: z.number().int().nonnegative(),
      published: z.number().int().nonnegative(),
      drafts: z.number().int().nonnegative(),
      featured: z.number().int().nonnegative(),
    }),
    contactSubmissions: z.object({
      total: z.number().int().nonnegative(),
      new: z.number().int().nonnegative(),
      processed: z.number().int().nonnegative(),
    }),
  }),
  userStats: z.object({
    total: z.number().int().nonnegative(),
    newThisMonth: z.number().int().nonnegative(),
  }),
  recentActivity: z.array(activityItemSchema),
});

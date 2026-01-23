import { z } from "zod";

import { ACTIVITY_TYPES_LIST } from "./dashboard.constants";

export const activityItemSchema = z.object({
  id: z.string(),
  type: z.enum(ACTIVITY_TYPES_LIST),
  title: z.string(),
  subtitle: z.string().nullable(),
  date: z.date(),
  status: z.string().optional(),
  rating: z.number().optional(),
  href: z.string(),
});

export const getDashboardDataResponseSchema = z.object({
  contentStats: z.object({
    storefrontPrograms: z.object({
      total: z.number(),
      active: z.number(),
      inactive: z.number(),
    }),
    reviews: z.object({
      total: z.number(),
      active: z.number(),
    }),
    blogPosts: z.object({
      total: z.number(),
      published: z.number(),
      drafts: z.number(),
      featured: z.number(),
    }),
    contactSubmissions: z.object({
      total: z.number(),
      new: z.number(),
      processed: z.number(),
    }),
  }),
  userStats: z.object({
    total: z.number(),
    newThisMonth: z.number(),
  }),
  recentActivity: z.array(activityItemSchema),
});

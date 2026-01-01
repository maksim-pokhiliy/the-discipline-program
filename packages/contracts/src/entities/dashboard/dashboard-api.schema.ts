import { z } from "zod";
import { DASHBOARD_ACTIVITY_TYPES } from "./dashboard.constants";

export const getDashboardDataResponseSchema = z.object({
  stats: z.object({
    totalPrograms: z.number(),
    activePrograms: z.number(),
    totalReviews: z.number(),
    activeReviews: z.number(),
    totalBlogPosts: z.number(),
    publishedBlogPosts: z.number(),
    totalContacts: z.number(),
    unreadContacts: z.number(),
  }),
  recentActivity: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(DASHBOARD_ACTIVITY_TYPES),
        title: z.string(),
        createdAt: z.date(),
      }),
    )
    .optional(),
});

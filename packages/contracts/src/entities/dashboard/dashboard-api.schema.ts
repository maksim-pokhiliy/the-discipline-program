import { z } from "zod";

export const getDashboardDataResponseSchema = z.object({
  contentStats: z.object({
    programs: z.object({
      total: z.number(),
      active: z.number(),
      inactive: z.number(),
    }),
    reviews: z.object({
      total: z.number(),
      active: z.number(),
      featured: z.number(),
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
});

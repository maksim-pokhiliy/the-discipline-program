import { z } from "zod";

import { ORDER_STATUSES } from "./dashboard.constants";

export const getDashboardDataResponseSchema = z
  .object({
    contentStats: z
      .object({
        programs: z
          .object({
            total: z.number(),
            active: z.number(),
            inactive: z.number(),
          })
          .strict(),
        reviews: z
          .object({
            total: z.number(),
            active: z.number(),
            featured: z.number(),
          })
          .strict(),
        blogPosts: z
          .object({
            total: z.number(),
            published: z.number(),
            drafts: z.number(),
            featured: z.number(),
          })
          .strict(),
        contactSubmissions: z
          .object({
            total: z.number(),
            new: z.number(),
            processed: z.number(),
          })
          .strict(),
      })
      .strict(),
    businessStats: z
      .object({
        revenue: z
          .object({
            total: z.number(),
            thisMonth: z.number(),
            thisWeek: z.number(),
          })
          .strict(),
        orders: z
          .object({
            total: z.number(),
            completed: z.number(),
            failed: z.number(),
            processing: z.number(),
          })
          .strict(),
        averageOrderValue: z.number(),
        conversionRate: z.number(),
        topPrograms: z.array(
          z
            .object({
              id: z.string(),
              name: z.string(),
              orderCount: z.number(),
              revenue: z.number(),
            })
            .strict(),
        ),
        recentOrders: z.array(
          z
            .object({
              id: z.string(),
              programName: z.string(),
              amount: z.number(),
              currency: z.string(),
              customerEmail: z.string(),
              status: z.enum(ORDER_STATUSES),
              createdAt: z.string(),
            })
            .strict(),
        ),
      })
      .strict(),
  })
  .strict();

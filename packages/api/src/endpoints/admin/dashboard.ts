import { OrderStatus } from "@prisma/client";
import { prisma } from "../../db/client";

export interface DashboardStats {
  programsCount: number;
  reviewsCount: number;
  blogPostsCount: number;
  totalRevenue: number;
  contactsCount: number;
  ordersCount: number;
}

export const adminDashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const [
      programsCount,
      reviewsCount,
      blogPostsCount,
      contactsCount,
      ordersCount,
      completedOrders,
    ] = await Promise.all([
      prisma.program.count({ where: { isActive: true } }),
      prisma.review.count({ where: { isActive: true } }),
      prisma.blogPost.count({ where: { isPublished: true } }),
      prisma.contactSubmission.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: { amount: true },
      }),
    ]);

    return {
      programsCount,
      reviewsCount,
      blogPostsCount,
      contactsCount,
      ordersCount,
      totalRevenue: completedOrders._sum.amount || 0,
    };
  },

  getRecentActivity: async () => {
    const [recentOrders, recentContacts, recentReviews] = await Promise.all([
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          programName: true,
          amount: true,
          currency: true,
          customerEmail: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.contactSubmission.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          program: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.review.findMany({
        take: 5,
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          authorName: true,
          rating: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      recentOrders,
      recentContacts,
      recentReviews,
    };
  },
};

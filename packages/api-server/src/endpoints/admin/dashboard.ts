import {
  type BusinessStats,
  type ContentStats,
  type DashboardData,
} from "@repo/contracts/dashboard";

import { prisma } from "../../db/client";

export const adminDashboardApi = {
  getDashboardData: async (): Promise<DashboardData> => {
    const [contentStats, businessStats] = await Promise.all([
      getContentStats(),
      getBusinessStats(),
    ]);

    return {
      contentStats,
      businessStats,
    };
  },
};

async function getContentStats(): Promise<ContentStats> {
  const [
    programsTotal,
    programsActive,
    reviewsTotal,
    reviewsActive,
    reviewsFeatured,
    blogTotal,
    blogPublished,
    blogFeatured,
    contactsTotal,
    contactsNew,
  ] = await Promise.all([
    prisma.program.count(),
    prisma.program.count({ where: { isActive: true } }),

    prisma.review.count(),
    prisma.review.count({ where: { isActive: true } }),
    prisma.review.count({ where: { isActive: true, isFeatured: true } }),

    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { isPublished: true } }),
    prisma.blogPost.count({ where: { isPublished: true, isFeatured: true } }),

    prisma.contactSubmission.count(),
    prisma.contactSubmission.count({ where: { status: "NEW" } }),
  ]);

  return {
    programs: {
      total: programsTotal,
      active: programsActive,
      inactive: programsTotal - programsActive,
    },
    reviews: {
      total: reviewsTotal,
      active: reviewsActive,
      featured: reviewsFeatured,
    },
    blogPosts: {
      total: blogTotal,
      published: blogPublished,
      drafts: blogTotal - blogPublished,
      featured: blogFeatured,
    },
    contactSubmissions: {
      total: contactsTotal,
      new: contactsNew,
      processed: contactsTotal - contactsNew,
    },
  };
}

async function getBusinessStats(): Promise<BusinessStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);

  startOfWeek.setDate(now.getDate() - now.getDay());

  const [
    ordersTotal,
    ordersCompleted,
    ordersFailed,
    ordersProcessing,
    revenueTotal,
    revenueThisMonth,
    revenueThisWeek,
    recentOrders,
    topPrograms,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.count({ where: { status: "FAILED" } }),
    prisma.order.count({ where: { status: "PROCESSING" } }),

    prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.order.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.order.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: { gte: startOfWeek },
      },
      _sum: { amount: true },
    }),

    prisma.order.findMany({
      take: 10,
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

    prisma.order.groupBy({
      by: ["programId", "programName"],
      where: { status: "COMPLETED" },
      _count: { id: true },
      _sum: { amount: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  const totalRevenue = revenueTotal._sum.amount || 0;
  const monthRevenue = revenueThisMonth._sum.amount || 0;
  const weekRevenue = revenueThisWeek._sum.amount || 0;

  const averageOrderValue = ordersCompleted > 0 ? totalRevenue / ordersCompleted : 0;

  const contactsCount = await prisma.contactSubmission.count();
  const conversionRate = contactsCount > 0 ? (ordersCompleted / contactsCount) * 100 : 0;

  return {
    revenue: {
      total: totalRevenue,
      thisMonth: monthRevenue,
      thisWeek: weekRevenue,
    },
    orders: {
      total: ordersTotal,
      completed: ordersCompleted,
      failed: ordersFailed,
      processing: ordersProcessing,
    },
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    conversionRate: Math.round(conversionRate * 100) / 100,
    topPrograms: topPrograms.map((program) => ({
      id: program.programId,
      name: program.programName,
      orderCount: program._count.id,
      revenue: program._sum.amount || 0,
    })),
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      programName: order.programName,
      amount: order.amount,
      currency: order.currency,
      customerEmail: order.customerEmail,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    })),
  };
}

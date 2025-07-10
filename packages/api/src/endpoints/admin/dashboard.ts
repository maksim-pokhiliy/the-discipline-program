import { OrderStatus } from "@prisma/client";
import { prisma } from "../../db/client";
import { DashboardData, DashboardStats, RecentActivityItem } from "../../types/dashboard";

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

  getRecentActivity: async (): Promise<RecentActivityItem[]> => {
    const [recentContacts, recentOrders, recentReviews, recentBlogPosts] = await Promise.all([
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
      prisma.review.findMany({
        take: 5,
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          authorName: true,
          rating: true,
          createdAt: true,
          isFeatured: true,
        },
      }),
      prisma.blogPost.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          isPublished: true,
          createdAt: true,
          slug: true,
        },
      }),
    ]);

    const activities: RecentActivityItem[] = [];

    // Add contacts
    recentContacts.forEach((contact) => {
      activities.push({
        id: `contact-${contact.id}`,
        type: "contact",
        title: `New contact from ${contact.name}`,
        subtitle: `${contact.program || "General inquiry"} • ${contact.email}`,
        timestamp: contact.createdAt.toISOString(),
        status: contact.status,
        href: `/contacts?id=${contact.id}`,
      });
    });

    // Add orders
    recentOrders.forEach((order) => {
      activities.push({
        id: `order-${order.id}`,
        type: "order",
        title: `${order.status === "COMPLETED" ? "Payment completed" : "New order"}: $${order.amount}`,
        subtitle: `${order.programName} • ${order.customerEmail}`,
        timestamp: order.createdAt.toISOString(),
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        href: `/orders?id=${order.id}`,
      });
    });

    // Add reviews
    recentReviews.forEach((review) => {
      activities.push({
        id: `review-${review.id}`,
        type: "review",
        title: `New review: ${review.rating} stars from ${review.authorName}`,
        subtitle: review.isFeatured ? "Featured review" : "Regular review",
        timestamp: review.createdAt.toISOString(),
        rating: review.rating,
        href: `/reviews?id=${review.id}`,
      });
    });

    // Add blog posts
    recentBlogPosts.forEach((post) => {
      activities.push({
        id: `blog-${post.id}`,
        type: "blog",
        title: post.isPublished ? `Published: ${post.title}` : `Draft created: ${post.title}`,
        subtitle: post.isPublished ? "Live on website" : "Unpublished draft",
        timestamp: post.createdAt.toISOString(),
        status: post.isPublished ? "published" : "draft",
        href: `/blog?id=${post.id}`,
      });
    });

    // Sort by timestamp and return latest 15
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15);
  },

  getQuickStats: async () => {
    const [newContactsCount, pendingOrdersCount, unpublishedPostsCount, featuredReviewsCount] =
      await Promise.all([
        prisma.contactSubmission.count({ where: { status: "NEW" } }),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.blogPost.count({ where: { isPublished: false } }),
        prisma.review.count({ where: { isFeatured: true, isActive: true } }),
      ]);

    return {
      newContactsCount,
      pendingOrdersCount,
      unpublishedPostsCount,
      featuredReviewsCount,
    };
  },

  getDashboardData: async (): Promise<DashboardData> => {
    const [stats, recentActivity, quickStats] = await Promise.all([
      adminDashboardApi.getStats(),
      adminDashboardApi.getRecentActivity(),
      adminDashboardApi.getQuickStats(),
    ]);

    return {
      stats,
      recentActivity,
      quickStats,
    };
  },
};

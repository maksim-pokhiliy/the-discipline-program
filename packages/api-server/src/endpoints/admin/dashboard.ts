import {
  ACTIVITY_TYPE,
  type ActivityItem,
  type ContentStats,
  type DashboardData,
  type UserStats,
} from "@repo/contracts/dashboard";

import { prisma } from "../../db/client";

export const adminDashboardApi = {
  getDashboardData: async (): Promise<DashboardData> => {
    const [contentStats, userStats, recentActivity] = await Promise.all([
      getContentStats(),
      getUserStats(),
      getRecentActivity(),
    ]);

    return {
      contentStats,
      userStats,
      recentActivity,
    };
  },
};

async function getContentStats(): Promise<ContentStats> {
  const [
    programsTotal,
    programsActive,
    reviewsTotal,
    reviewsActive,
    blogTotal,
    blogPublished,
    blogFeatured,
    contactsTotal,
    contactsNew,
  ] = await Promise.all([
    prisma.marketingStorefrontProgram.count({ where: { deletedAt: null } }),
    prisma.marketingStorefrontProgram.count({
      where: { isActive: true, deletedAt: null },
    }),

    prisma.marketingReview.count({ where: { deletedAt: null } }),
    prisma.marketingReview.count({
      where: { isActive: true, deletedAt: null },
    }),

    prisma.marketingBlogPost.count({ where: { deletedAt: null } }),
    prisma.marketingBlogPost.count({
      where: { isPublished: true, deletedAt: null },
    }),

    prisma.marketingBlogPost.count({
      where: { isPublished: true, isFeatured: true, deletedAt: null },
    }),

    prisma.marketingContactSubmission.count(),
    prisma.marketingContactSubmission.count({ where: { status: "PENDING" } }),
  ]);

  return {
    storefrontPrograms: {
      total: programsTotal,
      active: programsActive,
      inactive: programsTotal - programsActive,
    },
    reviews: {
      total: reviewsTotal,
      active: reviewsActive,
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

async function getUserStats(): Promise<UserStats> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, newThisMonth] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({
      where: { createdAt: { gte: firstDayOfMonth }, deletedAt: null },
    }),
  ]);

  return { total, newThisMonth };
}

async function getRecentActivity(): Promise<ActivityItem[]> {
  const take = 5;

  const [reviews, contacts, users, posts, programs] = await Promise.all([
    prisma.marketingReview.findMany({
      take,
      orderBy: { createdAt: "desc" },
      where: { deletedAt: null },
    }),
    prisma.marketingContactSubmission.findMany({
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      take,
      orderBy: { createdAt: "desc" },
      where: { deletedAt: null },
    }),
    prisma.marketingBlogPost.findMany({
      take,
      orderBy: { createdAt: "desc" },
      where: { deletedAt: null },
    }),
    prisma.marketingStorefrontProgram.findMany({
      take,
      orderBy: { createdAt: "desc" },
      where: { deletedAt: null },
    }),
  ]);

  const activities: ActivityItem[] = [
    ...reviews.map((r) => ({
      id: r.id,
      type: ACTIVITY_TYPE.REVIEW,
      title: `Review from ${r.authorName}`,
      subtitle: null,
      rating: r.rating,
      date: r.createdAt,
      status: r.isActive ? "Active" : "Hidden",
      href: `/reviews/${r.id}`,
    })),
    ...contacts.map((c) => ({
      id: c.id,
      type: ACTIVITY_TYPE.CONTACT,
      title: `Message from ${c.name || "Unknown"}`,
      subtitle: c.email || "No email",
      date: c.createdAt,
      status: c.status,
      href: `/contacts`,
    })),
    ...users.map((u) => ({
      id: u.id,
      type: ACTIVITY_TYPE.USER,
      title: "New user registration",
      subtitle: u.email,
      date: u.createdAt,
      href: `/users`,
    })),
    ...posts.map((p) => ({
      id: p.id,
      type: ACTIVITY_TYPE.BLOG_POST,
      title: `New post: ${p.title}`,
      subtitle: p.category,
      date: p.createdAt,
      status: p.isPublished ? "Published" : "Draft",
      href: `/blog/${p.id}`,
    })),
    ...programs.map((p) => ({
      id: p.id,
      type: ACTIVITY_TYPE.PROGRAM,
      title: `New program: ${p.title}`,
      subtitle: p.priceLabel || "Free",
      date: p.createdAt,
      status: p.isActive ? "Active" : "Inactive",
      href: `/storefront/${p.id}`,
    })),
  ];

  return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
}

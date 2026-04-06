import { ContactStatus } from "@repo/contracts/contact";
import {
  DashboardActivityType,
  type ActivityItem,
  type ContentStats,
  type DashboardData,
  type UserStats,
} from "@repo/contracts/dashboard";
import { centsToAmount } from "@repo/shared";

import { prisma } from "../../db/client";
import { mapToPrice } from "../../mappers";

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

const getContentStats = async (): Promise<ContentStats> => {
  const [
    productsTotal,
    productsActive,
    reviewsTotal,
    reviewsActive,
    blogTotal,
    blogPublished,
    blogFeatured,
    contactsTotal,
    contactsNew,
  ] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({
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

    prisma.marketingContactSubmission.count({ where: { deletedAt: null } }),
    prisma.marketingContactSubmission.count({
      where: { status: ContactStatus.NEW, deletedAt: null },
    }),
  ]);

  return {
    products: {
      total: productsTotal,
      active: productsActive,
      inactive: productsTotal - productsActive,
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
};

const getUserStats = async (): Promise<UserStats> => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, newThisMonth] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({
      where: { createdAt: { gte: firstDayOfMonth }, deletedAt: null },
    }),
  ]);

  return { total, newThisMonth };
};

const getRecentActivity = async (): Promise<ActivityItem[]> => {
  const take = 5;

  const [reviews, contacts, users, posts, products] = await Promise.all([
    prisma.marketingReview.findMany({
      take,
      orderBy: { createdAt: "desc" },
      where: { deletedAt: null },
    }),
    prisma.marketingContactSubmission.findMany({
      take,
      orderBy: { createdAt: "desc" },
      where: { deletedAt: null },
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
    prisma.product.findMany({
      take,
      orderBy: { createdAt: "desc" },
      where: { deletedAt: null },
      include: { prices: { where: { isActive: true }, take: 1 } },
    }),
  ]);

  const formatPriceSubtitle = (prices: { amountCents: number; currency: string }[]): string => {
    if (prices.length === 0) {
      return "No price set";
    }

    const p = mapToPrice(prices[0] as Parameters<typeof mapToPrice>[0]);

    return `${centsToAmount(p.amountCents).toFixed(0)} ${p.currency}`;
  };

  const activities: ActivityItem[] = [
    ...reviews.map((r) => ({
      id: r.id,
      type: DashboardActivityType.REVIEW,
      title: `Review from ${r.authorName}`,
      subtitle: null,
      rating: r.rating,
      date: r.createdAt,
      href: `/reviews/${r.id}`,
    })),
    ...contacts.map((c) => ({
      id: c.id,
      type: DashboardActivityType.CONTACT,
      title: `Message from ${c.name || "Unknown"}`,
      subtitle: c.contact || "No contact",
      date: c.createdAt,
      status: c.status,
      href: `/contacts/${c.id}`,
    })),
    ...users.map((u) => ({
      id: u.id,
      type: DashboardActivityType.USER,
      title: "New user registration",
      subtitle: u.email,
      date: u.createdAt,
      href: `/users`,
    })),
    ...posts.map((p) => ({
      id: p.id,
      type: DashboardActivityType.BLOG_POST,
      title: `New post: ${p.title}`,
      subtitle: p.category,
      date: p.createdAt,
      href: `/blog/${p.id}`,
    })),
    ...products.map((p) => ({
      id: p.id,
      type: DashboardActivityType.PROGRAM,
      title: `New product: ${p.title}`,
      subtitle: formatPriceSubtitle(p.prices),
      date: p.createdAt,
      href: `/products/${p.id}`,
    })),
  ];

  return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
};

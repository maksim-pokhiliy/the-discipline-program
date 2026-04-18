import { Prisma } from "@prisma/client";
import type {
  Currency as PrismaCurrency,
  PriceInterval as PrismaPriceInterval,
} from "@prisma/client";

import { ContactStatus } from "@repo/contracts/cms/contact";
import {
  DashboardActivityType,
  type ActivityItem,
  type ContentStats,
  type DashboardData,
  type UserStats,
} from "@repo/contracts/cms/dashboard";
import { ProductCurrency } from "@repo/contracts/cms/product";
import { centsToAmount } from "@repo/shared";

import { prisma } from "../../../db/client";
import {
  BLOG_CATEGORY_MAP,
  CONTACT_STATUS_TO_PRISMA_MAP,
  CURRENCY_MAP,
  PRICE_INTERVAL_MAP,
} from "../../../mappers/cms";

export const cmsDashboardAdminApi = {
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
    prisma.product.count(),
    prisma.product.count({
      where: { isActive: true },
    }),

    prisma.marketingReview.count(),
    prisma.marketingReview.count({
      where: { isActive: true },
    }),

    prisma.marketingBlogPost.count(),
    prisma.marketingBlogPost.count({
      where: { isPublished: true },
    }),

    prisma.marketingBlogPost.count({
      where: { isPublished: true, isFeatured: true },
    }),

    prisma.marketingContactSubmission.count(),
    prisma.marketingContactSubmission.count({
      where: { status: CONTACT_STATUS_TO_PRISMA_MAP[ContactStatus.NEW] },
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

  const [total, newThisMonth] = await prisma.$transaction(
    [
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: firstDayOfMonth } },
      }),
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );

  return { total, newThisMonth };
};

const getRecentActivity = async (): Promise<ActivityItem[]> => {
  const take = 5;

  const [reviews, contacts, users, posts, products] = await Promise.all([
    prisma.marketingReview.findMany({
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.marketingContactSubmission.findMany({
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.marketingBlogPost.findMany({
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      take,
      orderBy: { createdAt: "desc" },
      include: { prices: { where: { isActive: true }, take: 1 } },
    }),
  ]);

  const formatPriceSubtitle = (
    prices: {
      amountCents: number;
      currency: PrismaCurrency;
      interval: PrismaPriceInterval;
    }[],
  ): string => {
    const p = prices.at(0);

    if (!p) {
      return "No price set";
    }

    const currency = CURRENCY_MAP[p.currency] ?? ProductCurrency.USD;
    const interval = PRICE_INTERVAL_MAP[p.interval] ?? null;
    const amount = centsToAmount(p.amountCents).toFixed(0);
    const suffix = interval ? `/${interval}` : "";

    return `${amount} ${currency}${suffix}`;
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
      subtitle: BLOG_CATEGORY_MAP[p.category],
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

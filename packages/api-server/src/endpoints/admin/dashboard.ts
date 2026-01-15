import { type ContentStats, type DashboardData } from "@repo/contracts/dashboard";

import { prisma } from "../../db/client";

export const adminDashboardApi = {
  getDashboardData: async (): Promise<DashboardData> => {
    const contentStats = await getContentStats();

    return {
      contentStats,
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
    prisma.marketingProgramPreview.count(),
    prisma.marketingProgramPreview.count({ where: { isActive: true } }),

    prisma.marketingReview.count(),
    prisma.marketingReview.count({ where: { isActive: true } }),
    prisma.marketingReview.count({ where: { isFeatured: true } }),

    prisma.marketingBlogPost.count({ where: { deletedAt: null } }),
    prisma.marketingBlogPost.count({ where: { isPublished: true, deletedAt: null } }),

    prisma.marketingBlogPost.count({
      where: { isPublished: true, isFeatured: true, deletedAt: null },
    }),

    prisma.marketingContactSubmission.count(),
    prisma.marketingContactSubmission.count({ where: { status: "PENDING" } }),
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

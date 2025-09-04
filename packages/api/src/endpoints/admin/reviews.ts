import { Review } from "../../types";
import { prisma } from "../../db/client";

export const adminReviewsApi = {
  getReviews: async (): Promise<Review[]> => {
    const reviews = await prisma.review.findMany({
      orderBy: [
        { isFeatured: "desc" },
        { isActive: "desc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    const transformedReviews = reviews.map((review) => ({
      ...review,
    }));

    return transformedReviews;
  },

  getReviewById: async (id: string): Promise<Review | null> => {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    return review ?? null;
  },

  getReviewsStats: async () => {
    const [total, active, featured] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { isActive: true } }),
      prisma.review.count({ where: { isFeatured: true, isActive: true } }),
    ]);

    return {
      total,
      active,
      featured,
    };
  },

  getReviewsPageData: async () => {
    const [stats, reviews] = await Promise.all([
      adminReviewsApi.getReviewsStats(),
      adminReviewsApi.getReviews(),
    ]);

    return {
      stats,
      reviews,
    };
  },

  createReview: async (data: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<Review> => {
    const review = await prisma.review.create({
      data,
    });

    return review;
  },

  updateReview: async (id: string, data: Partial<Review>): Promise<Review> => {
    const review = await prisma.review.update({
      where: { id },
      data,
    });

    return review;
  },

  deleteReview: async (id: string): Promise<void> => {
    await prisma.review.delete({
      where: { id },
    });
  },

  toggleReviewStatus: async (id: string): Promise<Review> => {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new Error("Review not found");
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { isActive: !review.isActive },
    });

    return updated;
  },

  toggleReviewFeatured: async (id: string): Promise<Review> => {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new Error("Review not found");
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { isFeatured: !review.isFeatured },
    });

    return updated;
  },
};

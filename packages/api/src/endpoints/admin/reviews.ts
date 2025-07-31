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
      authorAvatar: review.authorAvatar || "/images/default-avatar.jpg",
    }));

    return transformedReviews;
  },

  getReviewById: async (id: string): Promise<Review | null> => {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return null;
    }

    return {
      ...review,
      authorAvatar: review.authorAvatar || "/images/default-avatar.jpg",
    };
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
};

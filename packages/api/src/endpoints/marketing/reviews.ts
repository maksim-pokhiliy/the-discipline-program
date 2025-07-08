import { Review } from "../../types";
import { prisma } from "../../db/client";

export const reviewsApi = {
  getReviews: async (): Promise<Review[]> => {
    const reviews = await prisma.review.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        authorAvatar: { not: null },
      },
      orderBy: { sortOrder: "asc" },
    });

    const transformedReviews = reviews.map((review) => ({
      ...review,
      authorAvatar: review.authorAvatar || "/images/default-avatar.jpg",
    }));

    return transformedReviews;
  },
};

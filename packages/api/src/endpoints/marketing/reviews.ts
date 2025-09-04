import { Review } from "../../types";
import { prisma } from "../../db/client";

export const reviewsApi = {
  getReviews: async (): Promise<Review[]> => {
    const reviews = await prisma.review.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    const transformedReviews = reviews.map((review) => ({
      ...review,
    }));

    return transformedReviews;
  },
};

import { type Review } from "@repo/contracts/review";

import { prisma } from "../../db/client";

export const reviewsApi = {
  getReviews: async (): Promise<Review[]> => {
    const reviews = await prisma.marketingReview.findMany({
      where: {
        isActive: true,
      },
    });

    const transformedReviews = reviews.map((review) => ({
      ...review,
    }));

    return transformedReviews;
  },
};

import { type Review } from "@repo/contracts/review";

import { prisma } from "../../db/client";
import { mapToReview } from "../../mappers";

export const reviewsApi = {
  getReviews: async (): Promise<Review[]> => {
    const reviews = await prisma.marketingReview.findMany({
      where: {
        isActive: true,
      },
    });

    return reviews.map(mapToReview);
  },
};

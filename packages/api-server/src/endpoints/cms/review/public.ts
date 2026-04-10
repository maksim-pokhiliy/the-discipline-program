import { type Review } from "@repo/contracts/cms/review";

import { prisma } from "../../../db/client";
import { mapToReview } from "../../../mappers";

export const cmsReviewPublicApi = {
  getReviews: async (): Promise<Review[]> => {
    const reviews = await prisma.marketingReview.findMany({
      where: {
        isActive: true,
      },
    });

    return reviews.map(mapToReview);
  },
};

import { type Review } from "@repo/contracts/cms/review";

import { prisma } from "../../../db/client";
import { mapToReview } from "../../../mappers/cms";
import { PUBLIC_LIST_LIMIT } from "../../../utils/list-limits";

export const cmsReviewPublicApi = {
  getReviews: async (): Promise<Review[]> => {
    const reviews = await prisma.marketingReview.findMany({
      where: {
        isActive: true,
      },
      take: PUBLIC_LIST_LIMIT,
    });

    return reviews.map(mapToReview);
  },
};

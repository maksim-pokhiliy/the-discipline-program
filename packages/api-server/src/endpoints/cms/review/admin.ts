import {
  type AdminReviewsPageData,
  type CreateReviewData,
  type Review,
  type UpdateReviewData,
} from "@repo/contracts/cms/review";

import { prisma } from "../../../db/client";
import { mapToReview } from "../../../mappers/cms";
import { findOrThrow, handlePrismaError } from "../../../utils";
import { DEFAULT_LIST_LIMIT } from "../../../utils/list-limits";

export const cmsReviewAdminApi = {
  getReviews: async (): Promise<Review[]> => {
    const reviews = await prisma.marketingReview.findMany({
      orderBy: { createdAt: "desc" },
      take: DEFAULT_LIST_LIMIT,
    });

    return reviews.map(mapToReview);
  },

  getReviewById: async (id: string): Promise<Review> => {
    const review = await findOrThrow(
      prisma.marketingReview.findUnique({ where: { id } }),
      "Review",
    );

    return mapToReview(review);
  },

  createReview: async (data: CreateReviewData): Promise<Review> => {
    try {
      const review = await prisma.marketingReview.create({ data });

      return mapToReview(review);
    } catch (error) {
      return handlePrismaError(error, { entity: "Review" });
    }
  },

  updateReview: async (id: string, data: UpdateReviewData): Promise<Review> => {
    await findOrThrow(prisma.marketingReview.findUnique({ where: { id } }), "Review");

    try {
      const review = await prisma.marketingReview.update({
        where: { id },
        data: {
          ...(data.authorName !== undefined && { authorName: data.authorName }),
          ...(data.authorRole !== undefined && { authorRole: data.authorRole }),
          ...(data.authorAvatar !== undefined && { authorAvatar: data.authorAvatar }),
          ...(data.text !== undefined && { text: data.text }),
          ...(data.rating !== undefined && { rating: data.rating }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      return mapToReview(review);
    } catch (error) {
      return handlePrismaError(error, { entity: "Review" });
    }
  },

  deleteReview: async (id: string): Promise<void> => {
    await findOrThrow(prisma.marketingReview.findUnique({ where: { id } }), "Review");

    try {
      await prisma.marketingReview.delete({ where: { id } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Review" });
    }
  },

  toggleReviewStatus: async (id: string): Promise<Review> => {
    const review = await findOrThrow(
      prisma.marketingReview.findUnique({ where: { id } }),
      "Review",
    );

    try {
      const updated = await prisma.marketingReview.update({
        where: { id },
        data: { isActive: !review.isActive },
      });

      return mapToReview(updated);
    } catch (error) {
      return handlePrismaError(error, { entity: "Review" });
    }
  },

  getReviewsPageData: async (): Promise<AdminReviewsPageData> => {
    const reviews = await cmsReviewAdminApi.getReviews();

    return { reviews };
  },
};

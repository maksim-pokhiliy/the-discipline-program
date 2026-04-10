import {
  type AdminReviewsPageData,
  type CreateReviewData,
  type Review,
  type UpdateReviewData,
} from "@repo/contracts/cms/review";

import { prisma } from "../../db/client";
import { mapToReview } from "../../mappers";
import { findOrThrow, handlePrismaError } from "../../utils";

export const adminReviewsApi = {
  getReviews: async (): Promise<Review[]> => {
    const reviews = await prisma.marketingReview.findMany({
      orderBy: { createdAt: "desc" },
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
        data,
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
    const reviews = await adminReviewsApi.getReviews();

    return { reviews };
  },
};

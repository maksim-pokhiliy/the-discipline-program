import { type CreateReviewData, type Review, type UpdateReviewData } from "@repo/contracts/review";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToReview } from "../../mappers";

export const adminReviewsApi = {
  async getReviews(): Promise<Review[]> {
    const reviews = await prisma.marketingReview.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return reviews.map(mapToReview);
  },

  async getReviewById(id: string): Promise<Review | null> {
    const review = await prisma.marketingReview.findUnique({ where: { id } });

    if (!review || review.deletedAt) {
      return null;
    }

    return mapToReview(review);
  },

  async createReview(data: CreateReviewData): Promise<Review> {
    const review = await prisma.marketingReview.create({ data });

    return mapToReview(review);
  },

  async updateReview(id: string, data: UpdateReviewData): Promise<Review> {
    const existing = await prisma.marketingReview.findUnique({ where: { id } });

    if (!existing || existing.deletedAt) {
      throw new NotFoundError("Review not found", { id });
    }

    const review = await prisma.marketingReview.update({
      where: { id },
      data,
    });

    return mapToReview(review);
  },

  async deleteReview(id: string): Promise<void> {
    const review = await prisma.marketingReview.findUnique({ where: { id } });

    if (!review || review.deletedAt) {
      throw new NotFoundError("Review not found", { id });
    }

    await prisma.marketingReview.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async toggleReviewStatus(id: string): Promise<Review> {
    const review = await prisma.marketingReview.findUnique({ where: { id } });

    if (!review || review.deletedAt) {
      throw new NotFoundError("Review not found", { id });
    }

    const updated = await prisma.marketingReview.update({
      where: { id },
      data: { isActive: !review.isActive },
    });

    return mapToReview(updated);
  },

  async getReviewsPageData() {
    const reviews = await adminReviewsApi.getReviews();

    return { reviews };
  },
};

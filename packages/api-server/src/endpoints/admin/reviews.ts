import { type Prisma, type MarketingReview } from "@prisma/client";

import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";

type CreateReviewInput = Prisma.MarketingReviewCreateInput;
type UpdateReviewInput = Prisma.MarketingReviewUpdateInput;

export const adminReviewsApi = {
  async getReviews(): Promise<MarketingReview[]> {
    return prisma.marketingReview.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async getReviewById(id: string): Promise<MarketingReview | null> {
    return prisma.marketingReview.findUnique({ where: { id } });
  },

  async createReview(data: CreateReviewInput): Promise<MarketingReview> {
    return prisma.marketingReview.create({
      data,
    });
  },

  async updateReview(id: string, data: UpdateReviewInput): Promise<MarketingReview> {
    return prisma.marketingReview.update({
      where: { id },
      data,
    });
  },

  async deleteReview(id: string): Promise<void> {
    await prisma.marketingReview.delete({ where: { id } });
  },

  async toggleReviewStatus(id: string): Promise<MarketingReview> {
    const review = await prisma.marketingReview.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundError("Review not found", { id });
    }

    return prisma.marketingReview.update({
      where: { id },
      data: { isActive: !review.isActive },
    });
  },

  async toggleReviewFeatured(id: string): Promise<MarketingReview> {
    const review = await prisma.marketingReview.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundError("Review not found", { id });
    }

    return prisma.marketingReview.update({
      where: { id },
      data: { isFeatured: !review.isFeatured },
    });
  },

  async getReviewsPageData() {
    const reviews = await prisma.marketingReview.findMany({
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      total: reviews.length,
      active: reviews.filter((r) => r.isActive).length,
      featured: reviews.filter((r) => r.isFeatured).length,
    };

    return { reviews, stats };
  },
};

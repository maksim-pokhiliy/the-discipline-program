import type { Review } from "@prisma/client";
import { prisma } from "../../db/client";
import { NotFoundError } from "@repo/errors";

type CreateReviewInput = Omit<Review, "id" | "createdAt" | "updatedAt">;
type UpdateReviewInput = Partial<Review>;

function normalizeProgramId<T extends { programId?: string | null }>(
  data: T,
): Omit<T, "programId"> & {
  programId?: string;
} {
  const { programId, ...rest } = data;

  if (typeof programId === "string" && programId.trim() !== "") {
    return { ...rest, programId };
  }

  return rest;
}

export const adminReviewsApi = {
  async getReviews(): Promise<Review[]> {
    return prisma.review.findMany({ orderBy: { sortOrder: "asc" } });
  },

  async getReviewById(id: string): Promise<Review | null> {
    return prisma.review.findUnique({ where: { id } });
  },

  async createReview(data: CreateReviewInput): Promise<Review> {
    const normalized = normalizeProgramId(data);

    return prisma.review.create({
      data: normalized,
    });
  },

  async updateReview(id: string, data: UpdateReviewInput): Promise<Review> {
    const normalized = normalizeProgramId(data);

    return prisma.review.update({
      where: { id },
      data: normalized,
    });
  },

  async deleteReview(id: string): Promise<void> {
    await prisma.review.delete({ where: { id } });
  },

  async toggleReviewStatus(id: string): Promise<Review> {
    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundError("Review not found", { id });
    }

    return prisma.review.update({
      where: { id },
      data: { isActive: !review.isActive },
    });
  },

  async toggleReviewFeatured(id: string): Promise<Review> {
    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundError("Review not found", { id });
    }

    return prisma.review.update({
      where: { id },
      data: { isFeatured: !review.isFeatured },
    });
  },

  async updateReviewsOrder(updates: { id: string; sortOrder: number }[]): Promise<void> {
    await prisma.$transaction(
      updates.map((u) =>
        prisma.review.update({
          where: { id: u.id },
          data: { sortOrder: u.sortOrder },
        }),
      ),
    );
  },

  async getReviewsPageData() {
    const reviews = await prisma.review.findMany({ orderBy: { sortOrder: "asc" } });

    const stats = {
      total: reviews.length,
      active: reviews.filter((r) => r.isActive).length,
      featured: reviews.filter((r) => r.isFeatured).length,
    };

    return { reviews, stats };
  },
};

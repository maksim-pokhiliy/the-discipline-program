import { Review } from "../../types";
import { prisma } from "../../db/client";

export const adminReviewsApi = {
  getReviews: async (): Promise<Review[]> => {
    const reviews = await prisma.review.findMany({
      orderBy: [
        { isFeatured: "desc" },
        { isActive: "desc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    const transformedReviews = reviews.map((review) => ({
      ...review,
      authorAvatar: review.authorAvatar || "",
    }));

    return transformedReviews;
  },

  getReviewById: async (id: string): Promise<Review | null> => {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return null;
    }

    return {
      ...review,
      authorAvatar: review.authorAvatar || "",
    };
  },

  getReviewsStats: async () => {
    const [total, active, featured] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { isActive: true } }),
      prisma.review.count({ where: { isFeatured: true, isActive: true } }),
    ]);

    return {
      total,
      active,
      featured,
    };
  },

  getReviewsPageData: async () => {
    const [stats, reviews] = await Promise.all([
      adminReviewsApi.getReviewsStats(),
      adminReviewsApi.getReviews(),
    ]);

    return {
      stats,
      reviews,
    };
  },

  createReview: async (data: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<Review> => {
    const review = await prisma.review.create({
      data: {
        authorName: data.authorName,
        authorRole: data.authorRole,
        authorAvatar: data.authorAvatar || null,
        text: data.text,
        rating: data.rating,
        programId: data.programId || null,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        sortOrder: data.sortOrder,
      },
    });

    return {
      ...review,
      authorAvatar: review.authorAvatar || "",
    };
  },

  updateReview: async (id: string, data: Partial<Review>): Promise<Review> => {
    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(data.authorName !== undefined && { authorName: data.authorName }),
        ...(data.authorRole !== undefined && { authorRole: data.authorRole }),
        ...(data.authorAvatar !== undefined && { authorAvatar: data.authorAvatar || null }),
        ...(data.text !== undefined && { text: data.text }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.programId !== undefined && { programId: data.programId || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    return {
      ...review,
      authorAvatar: review.authorAvatar || "",
    };
  },

  deleteReview: async (id: string): Promise<void> => {
    await prisma.review.delete({
      where: { id },
    });
  },

  toggleReviewStatus: async (id: string): Promise<Review> => {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new Error("Review not found");
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { isActive: !review.isActive },
    });

    return {
      ...updated,
      authorAvatar: updated.authorAvatar || "",
    };
  },

  toggleReviewFeatured: async (id: string): Promise<Review> => {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new Error("Review not found");
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { isFeatured: !review.isFeatured },
    });

    return {
      ...updated,
      authorAvatar: updated.authorAvatar || "",
    };
  },
};

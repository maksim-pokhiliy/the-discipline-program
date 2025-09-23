import { BlogStats, Review } from "../../types";
import { prisma } from "../../db/client";

export const adminBlogApi = {
  getPosts: async (): Promise<Review[]> => {
    const posts = await prisma.review.findMany({
      orderBy: [
        { isFeatured: "desc" },
        { isActive: "desc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    const transformedPosts = posts.map((review) => ({
      ...review,
    }));

    return transformedPosts;
  },

  // getReviewById: async (id: string): Promise<Review | null> => {
  //   const review = await prisma.review.findUnique({
  //     where: { id },
  //   });

  //   return review ?? null;
  // },

  getBlogStats: async (): Promise<BlogStats> => {
    const [total, published, drafts, featured] = await Promise.all([
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { isPublished: true } }),
      prisma.blogPost.count({ where: { isPublished: false } }),
      prisma.blogPost.count({ where: { isFeatured: true } }),
    ]);

    return {
      total,
      published,
      drafts,
      featured,
    };
  },

  getBlogPageData: async () => {
    const [stats, posts] = await Promise.all([
      adminBlogApi.getBlogStats(),
      adminBlogApi.getPosts(),
    ]);

    return {
      stats,
      posts,
    };
  },

  // createReview: async (data: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<Review> => {
  //   const review = await prisma.review.create({
  //     data,
  //   });

  //   return review;
  // },

  // updateReview: async (id: string, data: Partial<Review>): Promise<Review> => {
  //   const review = await prisma.review.update({
  //     where: { id },
  //     data,
  //   });

  //   return review;
  // },

  // deleteReview: async (id: string): Promise<void> => {
  //   await prisma.review.delete({
  //     where: { id },
  //   });
  // },

  // toggleReviewStatus: async (id: string): Promise<Review> => {
  //   const review = await prisma.review.findUnique({
  //     where: { id },
  //   });

  //   if (!review) {
  //     throw new Error("Review not found");
  //   }

  //   const updated = await prisma.review.update({
  //     where: { id },
  //     data: { isActive: !review.isActive },
  //   });

  //   return updated;
  // },

  // toggleReviewFeatured: async (id: string): Promise<Review> => {
  //   const review = await prisma.review.findUnique({
  //     where: { id },
  //   });

  //   if (!review) {
  //     throw new Error("Review not found");
  //   }

  //   const updated = await prisma.review.update({
  //     where: { id },
  //     data: { isFeatured: !review.isFeatured },
  //   });

  //   return updated;
  // },
};

import { AdminBlogPost, BlogStats, RawBlogPost } from "../../types";
import { prisma } from "../../db/client";

type BlogPostOrderUpdate = { id: string; sortOrder: number };

const transformPost = (post: RawBlogPost): AdminBlogPost => ({
  ...post,
  coverImage: post.coverImage ?? null,
  publishedAt: post.publishedAt ?? null,
  tags: post.tags ?? [],
  readTime: post.readTime ?? null,
});

export const adminBlogApi = {
  getPosts: async (): Promise<AdminBlogPost[]> => {
    const posts = await prisma.blogPost.findMany({
      orderBy: [
        { isFeatured: "desc" },
        { isPublished: "desc" },
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

  updatePostsOrder: async (updates: BlogPostOrderUpdate[]): Promise<AdminBlogPost[]> => {
    const transactions = updates.map(({ id, sortOrder }) =>
      prisma.blogPost.update({ where: { id }, data: { sortOrder } }),
    );

    const posts = await prisma.$transaction(transactions);

    return posts.map(transformPost);
  },
};

import { Prisma } from "@prisma/client";

import { type AdminBlogPost, type BlogStats, type RawBlogPost } from "@repo/contracts/blog";
import { NotFoundError, ConflictError } from "@repo/errors";

import { prisma } from "../../db/client";

type BlogPostCreateData = Omit<RawBlogPost, "id" | "createdAt" | "updatedAt">;
type BlogPostUpdateData = Partial<BlogPostCreateData>;

const transformPost = (post: RawBlogPost): AdminBlogPost => ({
  ...post,
  coverImage: post.coverImage ?? null,
  publishedAt: post.publishedAt ?? null,
  readTime: post.readTime ?? null,
});

const normalizeCoverImage = (coverImage?: string | null): string | null => {
  if (!coverImage) {
    return null;
  }

  const trimmed = coverImage.trim();

  return trimmed.length > 0 ? trimmed : null;
};

const computePublishedAt = (
  current: Date | null,
  isPublished?: boolean,
  provided?: Date | null,
): Date | null => {
  if (typeof isPublished === "boolean") {
    if (isPublished) {
      return provided ?? current ?? new Date();
    }

    return null;
  }

  if (provided !== undefined) {
    return provided ?? null;
  }

  return current;
};

const prepareUpdateData = (data: BlogPostUpdateData, current: RawBlogPost): BlogPostUpdateData => {
  const updated: BlogPostUpdateData = { ...data };

  if (data.coverImage !== undefined) {
    updated.coverImage = normalizeCoverImage(data.coverImage);
  }

  if (data.readTime !== undefined) {
    updated.readTime = data.readTime ?? null;
  }

  if (data.isPublished !== undefined || data.publishedAt !== undefined) {
    updated.publishedAt = computePublishedAt(
      current.publishedAt,
      data.isPublished,
      data.publishedAt ?? null,
    );
  }

  return updated;
};

const prepareCreateData = (data: BlogPostCreateData): BlogPostCreateData => {
  const prepared: BlogPostCreateData = {
    ...data,
    coverImage: normalizeCoverImage(data.coverImage),
    readTime: data.readTime ?? null,
    publishedAt: data.isPublished ? (data.publishedAt ?? new Date()) : null,
  };

  return prepared;
};

const handlePrismaError = (error: unknown): never => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    error.meta &&
    Array.isArray(error.meta.target) &&
    error.meta.target.includes("slug")
  ) {
    throw new ConflictError("Slug must be unique", { field: "slug" });
  }

  throw error;
};

export const adminBlogApi = {
  getPosts: async (): Promise<AdminBlogPost[]> => {
    const posts = await prisma.marketingBlogPost.findMany({
      orderBy: [{ isFeatured: "desc" }, { isPublished: "desc" }, { createdAt: "desc" }],
    });

    return posts;
  },

  getPostById: async (id: string): Promise<AdminBlogPost | null> => {
    const post = await prisma.marketingBlogPost.findUnique({
      where: { id },
    });

    return post ?? null;
  },

  getBlogStats: async (): Promise<BlogStats> => {
    const [total, published, drafts, featured] = await Promise.all([
      prisma.marketingBlogPost.count(),
      prisma.marketingBlogPost.count({ where: { isPublished: true } }),
      prisma.marketingBlogPost.count({ where: { isPublished: false } }),
      prisma.marketingBlogPost.count({ where: { isFeatured: true } }),
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

  createPost: async (data: BlogPostCreateData): Promise<AdminBlogPost> => {
    try {
      const post = await prisma.marketingBlogPost.create({
        data: prepareCreateData(data),
      });

      return transformPost(post);
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  updatePost: async (id: string, data: BlogPostUpdateData): Promise<AdminBlogPost> => {
    const existing = await prisma.marketingBlogPost.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundError("Blog post not found", { id });
    }

    try {
      const post = await prisma.marketingBlogPost.update({
        where: { id },
        data: prepareUpdateData(data, existing),
      });

      return transformPost(post);
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  deletePost: async (id: string): Promise<void> => {
    await prisma.marketingBlogPost.delete({
      where: { id },
    });
  },

  toggleBlogPostStatus: async (id: string): Promise<AdminBlogPost> => {
    const marketingBlogPost = await prisma.marketingBlogPost.findUnique({
      where: { id },
    });

    if (!marketingBlogPost) {
      throw new NotFoundError("Blog post not found", { id });
    }

    const updated = await prisma.marketingBlogPost.update({
      where: { id },
      data: { isPublished: !marketingBlogPost.isPublished },
    });

    return updated;
  },

  toggleBlogPostFeatured: async (id: string): Promise<AdminBlogPost> => {
    const marketingBlogPost = await prisma.marketingBlogPost.findUnique({
      where: { id },
    });

    if (!marketingBlogPost) {
      throw new NotFoundError("Blog post not found", { id });
    }

    const updated = await prisma.marketingBlogPost.update({
      where: { id },
      data: { isFeatured: !marketingBlogPost.isFeatured },
    });

    return updated;
  },
};

import { Prisma } from "@prisma/client";

import { type AdminBlogPost, type BlogStats, type RawBlogPost } from "@repo/contracts/blog";
import { NotFoundError, ConflictError } from "@repo/errors";

import { prisma } from "../../db/client";

type BlogPostCreateData = Omit<RawBlogPost, "id" | "createdAt" | "updatedAt">;
type BlogPostUpdateData = Partial<BlogPostCreateData>;
type BlogPostOrderUpdate = { id: string; sortOrder: number };

const transformPost = (post: RawBlogPost): AdminBlogPost => ({
  ...post,
  coverImage: post.coverImage ?? null,
  publishedAt: post.publishedAt ?? null,
  tags: post.tags ?? [],
  readTime: post.readTime ?? null,
});

const sanitizeTags = (tags?: string[] | null): string[] =>
  tags.map((tag) => tag.trim()).filter(Boolean) ?? [];

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

  if (data.tags !== undefined) {
    updated.tags = sanitizeTags(data.tags);
  }

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
    tags: sanitizeTags(data.tags),
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
    Array.isArray(error.meta.target) &&
    error.meta.target.includes("slug")
  ) {
    throw new ConflictError("Slug must be unique", { field: "slug" });
  }

  throw error;
};

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

    return posts;
  },

  getPostById: async (id: string): Promise<AdminBlogPost | null> => {
    const post = await prisma.blogPost.findUnique({
      where: { id },
    });

    return post ?? null;
  },

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

  createPost: async (data: BlogPostCreateData): Promise<AdminBlogPost> => {
    try {
      const post = await prisma.blogPost.create({
        data: prepareCreateData(data),
      });

      return transformPost(post);
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  updatePost: async (id: string, data: BlogPostUpdateData): Promise<AdminBlogPost> => {
    const existing = await prisma.blogPost.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundError("Blog post not found", { id });
    }

    try {
      const post = await prisma.blogPost.update({
        where: { id },
        data: prepareUpdateData(data, existing),
      });

      return transformPost(post);
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  deletePost: async (id: string): Promise<void> => {
    await prisma.blogPost.delete({
      where: { id },
    });
  },

  updatePostsOrder: async (updates: BlogPostOrderUpdate[]): Promise<AdminBlogPost[]> => {
    const transactions = updates.map(({ id, sortOrder }) =>
      prisma.blogPost.update({ where: { id }, data: { sortOrder } }),
    );

    const posts = await prisma.$transaction(transactions);

    return posts.map(transformPost);
  },

  toggleBlogPostStatus: async (id: string): Promise<AdminBlogPost> => {
    const blogPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!blogPost) {
      throw new NotFoundError("Blog post not found", { id });
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data: { isPublished: !blogPost.isPublished },
    });

    return updated;
  },

  toggleBlogPostFeatured: async (id: string): Promise<AdminBlogPost> => {
    const blogPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!blogPost) {
      throw new NotFoundError("Blog post not found", { id });
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data: { isFeatured: !blogPost.isFeatured },
    });

    return updated;
  },
};

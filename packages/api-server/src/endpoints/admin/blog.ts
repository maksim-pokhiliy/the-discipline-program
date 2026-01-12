import { Prisma, type MarketingBlogPost } from "@prisma/client";

import {
  type BlogPost,
  type BlogStats,
  type CreateBlogPostData,
  type UpdateBlogPostData,
} from "@repo/contracts/blog";
import { NotFoundError, ConflictError } from "@repo/errors";

import { prisma } from "../../db/client";

const mapToAdminBlogPost = (record: MarketingBlogPost): BlogPost => {
  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    excerpt: record.excerpt,
    content: record.content,
    coverImage: record.coverImage,
    publishedAt: record.publishedAt,
    readTime: record.readTime,
    authorName: record.authorName,
    category: record.category,
    tags: record.tags,
    isPublished: record.isPublished,
    isFeatured: record.isFeatured,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
};

const prepareCreateInput = (data: CreateBlogPostData): Prisma.MarketingBlogPostCreateInput => {
  return {
    ...data,
    coverImage: data.coverImage?.trim() || null,
    publishedAt: data.publishedAt,
  };
};

export const adminBlogApi = {
  getPosts: async (): Promise<BlogPost[]> => {
    const posts = await prisma.marketingBlogPost.findMany({
      orderBy: [{ isFeatured: "desc" }, { isPublished: "desc" }, { createdAt: "desc" }],
    });

    return posts.map(mapToAdminBlogPost);
  },

  getPostById: async (id: string): Promise<BlogPost | null> => {
    const post = await prisma.marketingBlogPost.findUnique({
      where: { id },
    });

    return post ? mapToAdminBlogPost(post) : null;
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

  createPost: async (data: CreateBlogPostData): Promise<BlogPost> => {
    try {
      const dbInput = prepareCreateInput(data);

      const post = await prisma.marketingBlogPost.create({
        data: dbInput,
      });

      return mapToAdminBlogPost(post);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        error.meta?.target &&
        Array.isArray(error.meta.target) &&
        error.meta.target.includes("slug")
      ) {
        throw new ConflictError("Slug must be unique", { field: "slug" });
      }

      throw error;
    }
  },

  updatePost: async (id: string, data: UpdateBlogPostData): Promise<BlogPost> => {
    const existing = await prisma.marketingBlogPost.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundError("Blog post not found", { id });
    }

    try {
      const updateData: Prisma.MarketingBlogPostUpdateInput = {
        ...data,
      };

      if (data.coverImage !== undefined) {
        updateData.coverImage = data.coverImage?.trim() || null;
      }

      const post = await prisma.marketingBlogPost.update({
        where: { id },
        data: updateData,
      });

      return mapToAdminBlogPost(post);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Slug must be unique", { field: "slug" });
      }

      throw error;
    }
  },

  deletePost: async (id: string): Promise<void> => {
    await prisma.marketingBlogPost.delete({
      where: { id },
    });
  },

  toggleBlogPostStatus: async (id: string): Promise<BlogPost> => {
    const post = await prisma.marketingBlogPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundError("Blog post not found", { id });
    }

    const updated = await prisma.marketingBlogPost.update({
      where: { id },
      data: { isPublished: !post.isPublished },
    });

    return mapToAdminBlogPost(updated);
  },

  toggleBlogPostFeatured: async (id: string): Promise<BlogPost> => {
    const post = await prisma.marketingBlogPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundError("Blog post not found", { id });
    }

    const updated = await prisma.marketingBlogPost.update({
      where: { id },
      data: { isFeatured: !post.isFeatured },
    });

    return mapToAdminBlogPost(updated);
  },
};

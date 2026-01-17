import { Prisma, type MarketingBlogPost } from "@prisma/client";

import {
  type BlogPost,
  type BlogStats,
  type CreateBlogPostData,
  type UpdateBlogPostData,
} from "@repo/contracts/blog";
import { ConflictError, NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";

const WORDS_PER_MINUTE = 200;

const calculateReadTime = (content: string): number => {
  const cleanContent = content.trim();

  if (!cleanContent) {return 0;}

  const wordCount = cleanContent.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / WORDS_PER_MINUTE);

  return Math.max(1, minutes);
};

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
  const now = new Date();
  let publishedAt = data.publishedAt;

  if (data.isPublished && !publishedAt) {
    publishedAt = now;
  }

  const readTime = calculateReadTime(data.content);

  return {
    ...data,
    readTime,
    coverImage: data.coverImage?.trim() || null,
    publishedAt: publishedAt,
  };
};

export const adminBlogApi = {
  getPosts: async (): Promise<BlogPost[]> => {
    const posts = await prisma.marketingBlogPost.findMany({
      orderBy: [{ createdAt: "desc" }, { title: "desc" }],
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
      prisma.marketingBlogPost.count({ where: { deletedAt: null } }),
      prisma.marketingBlogPost.count({ where: { isPublished: true, deletedAt: null } }),
      prisma.marketingBlogPost.count({ where: { isPublished: false, deletedAt: null } }),
      prisma.marketingBlogPost.count({ where: { isFeatured: true, deletedAt: null } }),
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

      return await prisma.$transaction(async (tx) => {
        if (dbInput.isFeatured) {
          await tx.marketingBlogPost.updateMany({
            where: { isFeatured: true },
            data: { isFeatured: false },
          });
        }

        const post = await tx.marketingBlogPost.create({
          data: dbInput,
        });

        return mapToAdminBlogPost(post);
      });
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

      if (data.isPublished === true && !existing.publishedAt && !data.publishedAt) {
        updateData.publishedAt = new Date();
      }

      if (data.content !== undefined) {
        updateData.readTime = calculateReadTime(data.content);
      }

      return await prisma.$transaction(async (tx) => {
        if (data.isFeatured === true) {
          await tx.marketingBlogPost.updateMany({
            where: { isFeatured: true, id: { not: id } },
            data: { isFeatured: false },
          });
        }

        const post = await tx.marketingBlogPost.update({
          where: { id },
          data: updateData,
        });

        return mapToAdminBlogPost(post);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Slug must be unique", { field: "slug" });
      }

      throw error;
    }
  },

  deletePost: async (id: string): Promise<void> => {
    const post = await prisma.marketingBlogPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundError("Blog post not found", { id });
    }

    await prisma.marketingBlogPost.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isPublished: false,
        isFeatured: false,
        slug: `${post.slug}-deleted-${Date.now()}`,
      },
    });
  },

  toggleBlogPostStatus: async (id: string): Promise<BlogPost> => {
    const post = await prisma.marketingBlogPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundError("Blog post not found", { id });
    }

    const newIsPublished = !post.isPublished;
    const updateData: Prisma.MarketingBlogPostUpdateInput = {
      isPublished: newIsPublished,
    };

    if (newIsPublished && !post.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const updated = await prisma.marketingBlogPost.update({
      where: { id },
      data: updateData,
    });

    return mapToAdminBlogPost(updated);
  },

  toggleBlogPostFeatured: async (id: string): Promise<BlogPost> => {
    return prisma.$transaction(async (tx) => {
      const post = await tx.marketingBlogPost.findUnique({
        where: { id },
      });

      if (!post) {
        throw new NotFoundError("Blog post not found", { id });
      }

      const newValue = !post.isFeatured;

      if (newValue === true) {
        await tx.marketingBlogPost.updateMany({
          where: {
            isFeatured: true,
            id: { not: id },
          },
          data: { isFeatured: false },
        });
      }

      const updated = await tx.marketingBlogPost.update({
        where: { id },
        data: { isFeatured: newValue },
      });

      return mapToAdminBlogPost(updated);
    });
  },
};

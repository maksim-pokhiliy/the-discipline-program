import { type Prisma } from "@prisma/client";

import {
  type BlogPost,
  type CreateBlogPostData,
  type UpdateBlogPostData,
} from "@repo/contracts/blog";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { mapToBlogPost } from "../../mappers";
import { handlePrismaError } from "../../utils";

const WORDS_PER_MINUTE = 200;

const calculateReadTime = (content: string): number => {
  const cleanContent = content.trim();

  if (!cleanContent) {
    return 0;
  }

  const wordCount = cleanContent.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / WORDS_PER_MINUTE);

  return Math.max(1, minutes);
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

    return posts.map(mapToBlogPost);
  },

  getPostById: async (id: string): Promise<BlogPost | null> => {
    const post = await prisma.marketingBlogPost.findUnique({
      where: { id },
    });

    if (!post) {
      return null;
    }

    return mapToBlogPost(post);
  },

  getBlogPageData: async () => {
    const posts = await adminBlogApi.getPosts();

    return { posts };
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

        return mapToBlogPost(post);
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Blog post", field: "slug" });
    }
  },

  updatePost: async (id: string, data: UpdateBlogPostData): Promise<BlogPost> => {
    const existing = await prisma.marketingBlogPost.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundError("Blog post not found", { id });
    }

    try {
      const updateData: Prisma.MarketingBlogPostUpdateInput = { ...data };

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

        return mapToBlogPost(post);
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Blog post", field: "slug" });
    }
  },

  deletePost: async (id: string): Promise<void> => {
    const post = await prisma.marketingBlogPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundError("Blog post not found", { id });
    }

    await prisma.marketingBlogPost.delete({ where: { id } });
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

    return mapToBlogPost(updated);
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
          where: { isFeatured: true, id: { not: id } },
          data: { isFeatured: false },
        });
      }

      const updated = await tx.marketingBlogPost.update({
        where: { id },
        data: { isFeatured: newValue },
      });

      return mapToBlogPost(updated);
    });
  },
};

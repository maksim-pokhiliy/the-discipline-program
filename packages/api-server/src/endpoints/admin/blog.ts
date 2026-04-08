import { type Prisma } from "@prisma/client";

import {
  type AdminBlogPageData,
  type BlogPost,
  type CreateBlogPostData,
  type UpdateBlogPostData,
} from "@repo/contracts/blog";

import { prisma } from "../../db/client";
import { mapToBlogPost } from "../../mappers";
import { findOrThrow, handlePrismaError, toggleExclusiveFeatured } from "../../utils";

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

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const unfeatureOthers = (tx: TxClient, excludeId?: string): Promise<Prisma.BatchPayload> =>
  tx.marketingBlogPost.updateMany({
    where: { isFeatured: true, ...(excludeId ? { id: { not: excludeId } } : {}) },
    data: { isFeatured: false },
  });

export const adminBlogApi = {
  getPosts: async (): Promise<BlogPost[]> => {
    const posts = await prisma.marketingBlogPost.findMany({
      orderBy: [{ createdAt: "desc" }, { title: "desc" }],
    });

    return posts.map(mapToBlogPost);
  },

  getPostById: async (id: string): Promise<BlogPost> => {
    const post = await findOrThrow(
      prisma.marketingBlogPost.findUnique({ where: { id } }),
      "Blog post",
    );

    return mapToBlogPost(post);
  },

  getBlogPageData: async (): Promise<AdminBlogPageData> => {
    const posts = await adminBlogApi.getPosts();

    return { posts };
  },

  createPost: async (data: CreateBlogPostData): Promise<BlogPost> => {
    try {
      const dbInput = prepareCreateInput(data);

      return await prisma.$transaction(async (tx) => {
        if (dbInput.isFeatured) {
          await unfeatureOthers(tx);
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
    const existing = await findOrThrow(
      prisma.marketingBlogPost.findUnique({ where: { id } }),
      "Blog post",
    );

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
          await unfeatureOthers(tx, id);
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
    await findOrThrow(prisma.marketingBlogPost.findUnique({ where: { id } }), "Blog post");

    await prisma.marketingBlogPost.delete({ where: { id } });
  },

  toggleBlogPostStatus: async (id: string): Promise<BlogPost> => {
    const post = await findOrThrow(
      prisma.marketingBlogPost.findUnique({ where: { id } }),
      "Blog post",
    );

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

  toggleBlogPostFeatured: async (id: string): Promise<BlogPost> =>
    toggleExclusiveFeatured({
      find: () => prisma.marketingBlogPost.findUnique({ where: { id } }),
      unfeatureOthers: () =>
        prisma.marketingBlogPost.updateMany({
          where: { isFeatured: true, id: { not: id } },
          data: { isFeatured: false },
        }),
      update: (isFeatured) =>
        prisma.marketingBlogPost.update({ where: { id }, data: { isFeatured } }),
      map: mapToBlogPost,
      entityName: "Blog post",
      id,
    }),
};

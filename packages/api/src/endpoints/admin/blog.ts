import { AdminBlogPageData, BlogPost, BlogStats } from "../../types";
import { prisma } from "../../db/client";

export const adminBlogApi = {
  getBlogPageData: async (): Promise<AdminBlogPageData> => {
    const [stats, posts] = await Promise.all([
      adminBlogApi.getBlogStats(),
      adminBlogApi.getPosts(),
    ]);

    return { stats, posts };
  },

  getBlogStats: async (): Promise<BlogStats> => {
    const [total, published, draft, featured] = await Promise.all([
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { isPublished: true } }),
      prisma.blogPost.count({ where: { isPublished: false } }),
      prisma.blogPost.count({ where: { isFeatured: true } }),
    ]);

    return { total, published, draft, featured };
  },

  getPosts: async (): Promise<BlogPost[]> => {
    const posts = await prisma.blogPost.findMany({
      orderBy: [
        { isFeatured: "desc" },
        { sortOrder: "asc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
    });

    return posts.map((post) => ({
      ...post,
      coverImage: post.coverImage || "/images/default-blog-cover.jpg",
      publishedAt: post.publishedAt || new Date(),
    }));
  },

  getPostById: async (id: string): Promise<BlogPost | null> => {
    const post = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      return null;
    }

    return {
      ...post,
      coverImage: post.coverImage || "/images/default-blog-cover.jpg",
      publishedAt: post.publishedAt || new Date(),
    };
  },

  createPost: async (data: Partial<BlogPost>): Promise<BlogPost> => {
    let slug = data.slug;

    if (!slug && data.title) {
      slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

      const existingCount = await prisma.blogPost.count({
        where: { slug: { startsWith: slug } },
      });

      if (existingCount > 0) {
        slug = `${slug}-${existingCount + 1}`;
      }
    }

    const readTime = data.content ? Math.ceil(data.content.split(/\s+/).length / 200) : 5;

    const maxSortOrder = await prisma.blogPost
      .findFirst({
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      })
      .then((result) => result?.sortOrder || 0);

    const post = await prisma.blogPost.create({
      data: {
        title: data.title || "Untitled Post",
        slug: slug || "untitled-post",
        excerpt: data.excerpt || "",
        content: data.content || "",
        coverImage: data.coverImage,
        author: data.author || "Denis Sergeev",
        publishedAt: data.isPublished ? new Date() : null,
        readTime,
        category: data.category || "General",
        tags: data.tags || [],
        isPublished: data.isPublished || false,
        isFeatured: data.isFeatured || false,
        sortOrder: data.sortOrder ?? maxSortOrder + 1,
      },
    });

    return {
      ...post,
      coverImage: post.coverImage || "/images/default-blog-cover.jpg",
      publishedAt: post.publishedAt || new Date(),
    };
  },

  updatePost: async (id: string, data: Partial<BlogPost>): Promise<BlogPost> => {
    const readTime = data.content ? Math.ceil(data.content.split(/\s+/).length / 200) : undefined;

    let publishedAt: Date | null | undefined;

    if (data.isPublished !== undefined) {
      const currentPost = await prisma.blogPost.findUnique({
        where: { id },
        select: { isPublished: true },
      });

      if (currentPost && !currentPost.isPublished && data.isPublished) {
        publishedAt = new Date();
      } else if (currentPost && currentPost.isPublished && !data.isPublished) {
        publishedAt = null;
      }
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...data,
        ...(readTime !== undefined && { readTime }),
        ...(publishedAt !== undefined && { publishedAt }),
      },
    });

    return {
      ...post,
      coverImage: post.coverImage || "/images/default-blog-cover.jpg",
      publishedAt: post.publishedAt || new Date(),
    };
  },

  deletePost: async (id: string): Promise<void> => {
    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: { isPublished: true },
    });

    if (post?.isPublished) {
      throw new Error("Cannot delete published post. Unpublish it first.");
    }

    await prisma.blogPost.delete({
      where: { id },
    });
  },

  togglePublishStatus: async (id: string): Promise<BlogPost> => {
    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: { isPublished: true },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        isPublished: !post.isPublished,
        publishedAt: !post.isPublished ? new Date() : null,
      },
    });

    return {
      ...updatedPost,
      coverImage: updatedPost.coverImage || "/images/default-blog-cover.jpg",
      publishedAt: updatedPost.publishedAt || new Date(),
    };
  },

  toggleFeaturedStatus: async (id: string): Promise<BlogPost> => {
    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: { isFeatured: true },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        isFeatured: !post.isFeatured,
      },
    });

    return {
      ...updatedPost,
      coverImage: updatedPost.coverImage || "/images/default-blog-cover.jpg",
      publishedAt: updatedPost.publishedAt || new Date(),
    };
  },

  getCategories: async (): Promise<string[]> => {
    const posts = await prisma.blogPost.findMany({
      select: { category: true },
      distinct: ["category"],
    });

    return posts.map((p) => p.category);
  },

  getTags: async (): Promise<string[]> => {
    const posts = await prisma.blogPost.findMany({
      select: { tags: true },
    });

    const allTags = posts.flatMap((p) => p.tags);

    return Array.from(new Set(allTags));
  },
};

"use client";

import { BlogPost } from "@repo/api";

export const generateUniqueSlug = (title: string, existingPosts: BlogPost[]): string => {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  const existingSlugs = new Set(existingPosts.map((p) => p.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  let newSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.has(newSlug)) {
    counter++;
    newSlug = `${baseSlug}-${counter}`;
  }

  return newSlug;
};

export const createDuplicatePost = (
  originalPost: BlogPost,
  posts: BlogPost[],
): Omit<BlogPost, "id" | "createdAt" | "updatedAt" | "publishedAt"> & {
  publishedAt: Date | null;
} => {
  const duplicateTitle = `${originalPost.title} (Copy)`;
  const duplicateSlug = generateUniqueSlug(duplicateTitle, posts);
  const maxSortOrder = Math.max(...posts.map((p) => p.sortOrder), 0);

  return {
    title: duplicateTitle,
    slug: duplicateSlug,
    excerpt: originalPost.excerpt,
    content: originalPost.content,
    coverImage: originalPost.coverImage,
    author: originalPost.author,
    publishedAt: null,
    readTime: originalPost.readTime,
    category: originalPost.category,
    tags: [...originalPost.tags],
    isPublished: false,
    isFeatured: false,
    sortOrder: maxSortOrder + 1,
  };
};

export const calculateReadTime = (content: string): number => {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;

  return Math.ceil(wordCount / wordsPerMinute);
};

export const formatPostStatus = (post: BlogPost): string => {
  if (!post.isPublished) {
    return "Draft";
  }

  if (post.isFeatured) {
    return "Featured";
  }

  return "Published";
};

export const getStatusColor = (post: BlogPost): "default" | "success" | "warning" | "error" => {
  if (!post.isPublished) {
    return "default";
  }

  if (post.isFeatured) {
    return "warning";
  }

  return "success";
};

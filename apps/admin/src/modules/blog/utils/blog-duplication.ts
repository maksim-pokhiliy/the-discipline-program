"use client";

import { type AdminBlogPost } from "@repo/contracts/blog";

import { getMaxSortOrder } from "./helpers";

const ensureUniqueSlug = (slug: string, posts: AdminBlogPost[]): string => {
  const existingSlugs = new Set(posts.map((post) => post.slug));

  if (!existingSlugs.has(slug)) {
    return slug;
  }

  let index = 1;
  let candidate = `${slug}-${index}`;

  while (existingSlugs.has(candidate)) {
    index += 1;
    candidate = `${slug}-${index}`;
  }

  return candidate;
};

export const createDuplicateBlogPost = (
  original: AdminBlogPost,
  posts: AdminBlogPost[],
): Omit<AdminBlogPost, "id" | "createdAt" | "updatedAt"> => {
  const maxSortOrder = getMaxSortOrder(posts);
  const baseSlug = ensureUniqueSlug(`${original.slug}-copy`, posts);

  return {
    title: `${original.title} (Copy)`,
    slug: baseSlug,
    excerpt: original.excerpt,
    content: original.content,
    coverImage: original.coverImage,
    author: original.author,
    category: original.category,
    tags: [...(original.tags ?? [])],
    readTime: original.readTime,
    isPublished: false,
    isFeatured: false,
    sortOrder: maxSortOrder + 1,
    publishedAt: null,
  };
};

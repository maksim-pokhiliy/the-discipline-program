import { type MarketingBlogPost } from "@prisma/client";

import { type BlogPost, type PublicBlogPost } from "@repo/contracts/cms/blog";

import { BLOG_CATEGORY_MAP } from "./enum-maps";

type PublishedPost = MarketingBlogPost & { publishedAt: Date };

export const isPublishedPost = (post: MarketingBlogPost): post is PublishedPost => {
  return post.publishedAt !== null;
};

export const mapToBlogPost = (record: MarketingBlogPost): BlogPost => ({
  id: record.id,
  title: record.title,
  slug: record.slug,
  excerpt: record.excerpt,
  content: record.content,
  coverImage: record.coverImage,
  publishedAt: record.publishedAt,
  readTime: record.readTime,
  authorName: record.authorName,
  category: BLOG_CATEGORY_MAP[record.category],
  tags: record.tags,
  isPublished: record.isPublished,
  isFeatured: record.isFeatured,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

export const mapToPublicBlogPost = (post: PublishedPost): PublicBlogPost => ({
  id: post.id,
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt,
  content: post.content,
  coverImage: post.coverImage,
  publishedAt: post.publishedAt,
  isFeatured: post.isFeatured,
  readTime: post.readTime,
  authorName: post.authorName,
  category: BLOG_CATEGORY_MAP[post.category],
  tags: post.tags,
});

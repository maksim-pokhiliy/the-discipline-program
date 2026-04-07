import { type MarketingBlogPost } from "@prisma/client";

import { BlogCategory, type BlogPost, type PublicBlogPost } from "@repo/contracts/blog";

type PublishedPost = MarketingBlogPost & { publishedAt: Date };

const BLOG_CATEGORY_VALUES = new Set<string>(Object.values(BlogCategory));

const mapBlogCategory = (category: string): BlogCategory =>
  BLOG_CATEGORY_VALUES.has(category) ? (category as BlogCategory) : BlogCategory.UNCATEGORIZED;

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
  category: mapBlogCategory(record.category),
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
  category: mapBlogCategory(post.category),
  tags: post.tags,
});

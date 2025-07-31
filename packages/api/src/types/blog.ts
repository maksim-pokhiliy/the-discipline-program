import { BlogPost as PrismaBlogPost } from "@prisma/client";

export type RawBlogPost = PrismaBlogPost;

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  publishedAt: Date;
  readTime: number | null;
  category: string;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogPageData {
  hero: {
    title: string;
    subtitle: string;
  };
  featuredPost?: BlogPost;
  posts: BlogPost[];
  categories: string[];
}

export interface BlogPostPageData {
  post: BlogPost;
  relatedPosts: BlogPost[];
}

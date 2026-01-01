import { z } from "zod";
import {
  blogPostSchema,
  createBlogPostSchema,
  updateBlogPostSchema,
  updateBlogPostOrderSchema,
} from "./blog.schema";

export type BlogPost = z.infer<typeof blogPostSchema>;
export type CreateBlogPostData = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostData = z.infer<typeof updateBlogPostSchema>;
export type UpdateBlogPostOrder = z.infer<typeof updateBlogPostOrderSchema>;

export interface BlogStats {
  total: number;
  published: number;
  drafts: number;
  featured: number;
}

export interface AdminBlogPageData {
  stats: BlogStats;
  posts: BlogPost[];
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

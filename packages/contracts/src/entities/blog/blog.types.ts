import { type z } from "zod";

import { type getBlogPageDataResponseSchema } from "./blog-api.schema";
import {
  type blogPostSchema,
  type createBlogPostSchema,
  type updateBlogPostSchema,
  type updateBlogPostOrderSchema,
} from "./blog.schema";

export type BlogPost = z.infer<typeof blogPostSchema>;

export type CreateBlogPostData = z.infer<typeof createBlogPostSchema>;

export type UpdateBlogPostData = z.infer<typeof updateBlogPostSchema>;

export type UpdateBlogPostOrder = z.infer<typeof updateBlogPostOrderSchema>;

export type AdminBlogPageData = z.infer<typeof getBlogPageDataResponseSchema>;

export type BlogStats = AdminBlogPageData["stats"];

export type AdminBlogPost = Omit<BlogPost, "coverImage" | "publishedAt"> & {
  coverImage: string | null;
  publishedAt: Date | null;
};

export type RawBlogPost = BlogPost;

export type PublicBlogPost = Omit<
  BlogPost,
  | "coverImage"
  | "publishedAt"
  | "sortOrder"
  | "createdAt"
  | "updatedAt"
  | "isFeatured"
  | "isPublished"
> & {
  coverImage: string;
  publishedAt: Date;
};

export type PublicBlogPostPreview = Pick<
  PublicBlogPost,
  "id" | "slug" | "title" | "excerpt" | "coverImage" | "category" | "publishedAt" | "readTime"
>;

export type BlogPostPageData = {
  post: PublicBlogPost;
  relatedPosts: PublicBlogPostPreview[];
};

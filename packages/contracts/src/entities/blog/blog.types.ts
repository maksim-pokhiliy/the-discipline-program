import { type z } from "zod";

import { type getBlogPageDataResponseSchema } from "./blog-api.schema";
import {
  type blogPostSchema,
  type createBlogPostSchema,
  type updateBlogPostSchema,
  type publicBlogPostSchema,
} from "./blog.schema";

export type BlogPost = z.infer<typeof blogPostSchema>;
export type CreateBlogPostData = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostData = z.infer<typeof updateBlogPostSchema>;

export type AdminBlogPageData = z.infer<typeof getBlogPageDataResponseSchema>;
export type BlogStats = AdminBlogPageData["stats"];

export type PublicBlogPost = z.infer<typeof publicBlogPostSchema>;

export type PublicBlogPostPreview = Pick<
  PublicBlogPost,
  | "id"
  | "slug"
  | "title"
  | "excerpt"
  | "coverImage"
  | "publishedAt"
  | "readTime"
  | "category"
  | "tags"
>;

export type BlogPostPageData = {
  post: PublicBlogPost;
  relatedPosts: PublicBlogPostPreview[];
};

import { type z } from "zod";

import { type getBlogPageDataResponseSchema } from "./blog-api.schema";
import {
  type blogPostPageDataSchema,
  type blogPostSchema,
  type createBlogPostSchema,
  type publicBlogPostPreviewSchema,
  type publicBlogPostSchema,
  type updateBlogPostSchema,
} from "./blog.schema";

export type BlogPost = z.infer<typeof blogPostSchema>;
export type CreateBlogPostData = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostData = z.infer<typeof updateBlogPostSchema>;

export type AdminBlogPageData = z.infer<typeof getBlogPageDataResponseSchema>;

export type PublicBlogPost = z.infer<typeof publicBlogPostSchema>;
export type PublicBlogPostPreview = z.infer<typeof publicBlogPostPreviewSchema>;
export type BlogPostPageData = z.infer<typeof blogPostPageDataSchema>;

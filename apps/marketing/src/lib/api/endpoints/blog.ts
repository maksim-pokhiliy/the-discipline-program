import { type ApiClient } from "@repo/api-client";
import { type BlogPostPageData } from "@repo/contracts/cms/blog";

export const createBlogAPI = (client: ApiClient) => ({
  getArticle: (slug: string): Promise<BlogPostPageData> =>
    client.request(`/api/public/blog/${slug}`),
});

import { type ApiClient } from "@repo/api-client";
import {
  type AboutPageData,
  type BlogPageData,
  type BlogPostPageData,
  type ContactPageData,
  type HomePageData,
  type StorefrontProgramsPageData,
} from "@repo/contracts";

export const createPagesAPI = (client: ApiClient) => ({
  getHome: (): Promise<HomePageData> => client.request("/api/public/pages/home"),

  getStorefrontPrograms: (): Promise<StorefrontProgramsPageData> =>
    client.request("/api/public/pages/storefront"),

  getAbout: (): Promise<AboutPageData> => client.request("/api/public/pages/about"),
  getBlog: (): Promise<BlogPageData> => client.request("/api/public/pages/blog"),
  getContact: (): Promise<ContactPageData> => client.request("/api/public/pages/contact"),

  getBlogArticle: (slug: string): Promise<BlogPostPageData> =>
    client.request(`/api/public/blog/${slug}`),
});

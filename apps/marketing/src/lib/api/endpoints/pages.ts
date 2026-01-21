import {
  type AboutPageData,
  type BlogPageData,
  type BlogPostPageData,
  type ContactPageData,
  type HomePageData,
  type StorefrontProgramsPageData,
} from "@repo/contracts";

import { apiClient } from "../client";

export const pagesAPI = {
  getHome: (): Promise<HomePageData> => apiClient.request("/api/public/pages/home"),

  getStorefrontPrograms: (): Promise<StorefrontProgramsPageData> =>
    apiClient.request("/api/public/pages/storefront"),

  getAbout: (): Promise<AboutPageData> => apiClient.request("/api/public/pages/about"),
  getBlog: (): Promise<BlogPageData> => apiClient.request("/api/public/pages/blog"),
  getContact: (): Promise<ContactPageData> => apiClient.request("/api/public/pages/contact"),

  getBlogArticle: (slug: string): Promise<BlogPostPageData> =>
    apiClient.request(`/api/public/blog/${slug}`),
};

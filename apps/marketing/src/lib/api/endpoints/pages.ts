import {
  AboutPageData,
  BlogPageData,
  BlogPostPageData,
  ContactPageData,
  HomePageData,
  ProgramsPageData,
} from "@repo/api";

import { apiClient } from "../client";

export const pagesAPI = {
  getHome: (): Promise<HomePageData> => apiClient.request("/api/marketing/pages/home"),
  getPrograms: (): Promise<ProgramsPageData> => apiClient.request("/api/marketing/pages/programs"),
  getAbout: (): Promise<AboutPageData> => apiClient.request("/api/marketing/pages/about"),
  getBlog: (): Promise<BlogPageData> => apiClient.request("/api/marketing/pages/blog"),
  getContact: (): Promise<ContactPageData> => apiClient.request("/api/marketing/pages/contact"),

  getBlogArticle: (slug: string): Promise<BlogPostPageData> =>
    apiClient.request(`/api/marketing/blog-articles/${slug}`),
};

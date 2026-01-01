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
  getHome: (): Promise<HomePageData> => apiClient.request("/api/public/pages/home"),
  getPrograms: (): Promise<ProgramsPageData> => apiClient.request("/api/public/pages/programs"),
  getAbout: (): Promise<AboutPageData> => apiClient.request("/api/public/pages/about"),
  getBlog: (): Promise<BlogPageData> => apiClient.request("/api/public/pages/blog"),
  getContact: (): Promise<ContactPageData> => apiClient.request("/api/public/pages/contact"),

  getBlogArticle: (slug: string): Promise<BlogPostPageData> =>
    apiClient.request(`/api/public/blog/${slug}`),
};

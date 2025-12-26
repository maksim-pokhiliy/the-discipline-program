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
  getHome: (): Promise<HomePageData> => apiClient.request("/api/pages/home"),
  getPrograms: (): Promise<ProgramsPageData> => apiClient.request("/api/pages/programs"),
  getAbout: (): Promise<AboutPageData> => apiClient.request("/api/pages/about"),
  getBlog: (): Promise<BlogPageData> => apiClient.request("/api/pages/blog"),
  getContact: (): Promise<ContactPageData> => apiClient.request("/api/pages/contact"),

  getBlogArticle: (slug: string): Promise<BlogPostPageData> =>
    apiClient.request(`/api/blog-articles/${slug}`),
};

import {
  AboutPageData,
  BlogPageData,
  BlogPostPageData,
  ContactPageData,
  HomePageData,
  Program,
  ProgramsPageData,
  Review,
} from "@repo/api";

import { marketingApiClient } from "./client";

export const marketingApi = {
  pages: {
    getHome: (): Promise<HomePageData> => marketingApiClient.request("/api/marketing/pages/home"),

    getPrograms: (): Promise<ProgramsPageData> =>
      marketingApiClient.request("/api/marketing/pages/programs"),

    getAbout: (): Promise<AboutPageData> =>
      marketingApiClient.request("/api/marketing/pages/about"),

    getBlog: (): Promise<BlogPageData> => marketingApiClient.request("/api/marketing/pages/blog"),

    getBlogArticle: (slug: string): Promise<BlogPostPageData> =>
      marketingApiClient.request(`/api/marketing/blog-articles/${slug}`),

    getContact: (): Promise<ContactPageData> =>
      marketingApiClient.request("/api/marketing/pages/contact"),
  },

  programs: {
    getAll: (): Promise<Program[]> => marketingApiClient.request("/api/marketing/programs"),
  },

  reviews: {
    getAll: (): Promise<Review[]> => marketingApiClient.request("/api/marketing/reviews"),
  },
};

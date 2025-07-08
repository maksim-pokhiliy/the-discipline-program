import { useQuery } from "@tanstack/react-query";

import { marketingApi } from "../api";

export const useMarketingApi = {
  useHomePage: () =>
    useQuery({
      queryKey: ["marketing", "pages", "home"],
      queryFn: marketingApi.pages.getHome,
    }),

  useProgramsPage: () =>
    useQuery({
      queryKey: ["marketing", "pages", "programs"],
      queryFn: marketingApi.pages.getPrograms,
    }),

  useAboutPage: () =>
    useQuery({
      queryKey: ["marketing", "pages", "about"],
      queryFn: marketingApi.pages.getAbout,
    }),

  useBlogPage: () =>
    useQuery({
      queryKey: ["marketing", "pages", "blog"],
      queryFn: marketingApi.pages.getBlog,
    }),

  useContactPage: () =>
    useQuery({
      queryKey: ["marketing", "pages", "contact"],
      queryFn: marketingApi.pages.getContact,
    }),

  useBlogArticle: (slug: string) =>
    useQuery({
      queryKey: ["marketing", "blog-articles", slug],
      queryFn: () => marketingApi.pages.getBlogArticle(slug),
      enabled: !!slug,
    }),

  usePrograms: () =>
    useQuery({
      queryKey: ["marketing", "programs"],
      queryFn: marketingApi.programs.getAll,
    }),

  useReviews: () =>
    useQuery({
      queryKey: ["marketing", "reviews"],
      queryFn: marketingApi.reviews.getAll,
    }),
};

export const useHomePage = useMarketingApi.useHomePage;
export const useProgramsPage = useMarketingApi.useProgramsPage;
export const useAboutPage = useMarketingApi.useAboutPage;
export const useBlogPage = useMarketingApi.useBlogPage;
export const useContactPage = useMarketingApi.useContactPage;
export const useBlogArticle = useMarketingApi.useBlogArticle;
export const usePrograms = useMarketingApi.usePrograms;
export const useReviews = useMarketingApi.useReviews;

"use client";

import { type QueryKey, useQuery } from "@tanstack/react-query";

import {
  type HomePageData,
  type StorefrontProgramsPageData,
  type AboutPageData,
  type BlogPageData,
  type ContactPageData,
  type FaqPageData,
} from "@repo/contracts/pages";
import { marketingKeys, STALE_TIMES } from "@repo/query";

import { api } from "../api";

type UsePageOptions<T> = {
  initialData?: T;
};

const createPageHook =
  <T>(queryKey: QueryKey, queryFn: () => Promise<T>) =>
  ({ initialData }: UsePageOptions<T> = {}) =>
    useQuery({
      queryKey,
      queryFn,
      initialData,
      staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
    });

export const useHomePage = createPageHook<HomePageData>(
  marketingKeys.pages.home(),
  api.pages.getHome,
);

export const useStorefrontProgramsPage = createPageHook<StorefrontProgramsPageData>(
  marketingKeys.pages.storefront(),
  api.pages.getStorefrontPrograms,
);

export const useAboutPage = createPageHook<AboutPageData>(
  marketingKeys.pages.about(),
  api.pages.getAbout,
);

export const useBlogPage = createPageHook<BlogPageData>(
  marketingKeys.pages.blog(),
  api.pages.getBlog,
);

export const useContactPage = createPageHook<ContactPageData>(
  marketingKeys.pages.contact(),
  api.pages.getContact,
);

export const useFaqPage = createPageHook<FaqPageData>(marketingKeys.pages.faq(), api.pages.getFaq);

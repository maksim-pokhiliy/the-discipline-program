import { useQuery } from "@tanstack/react-query";

import {
  type HomePageData,
  type ProgramsPageData,
  type AboutPageData,
  type BlogPageData,
  type ContactPageData,
} from "@repo/contracts";
import { marketingKeys, STALE_TIMES } from "@repo/query";

import { api } from "../api";

interface UseHomePageOptions {
  initialData?: HomePageData;
}

interface UseProgramsPageOptions {
  initialData?: ProgramsPageData;
}

interface UseAboutPageOptions {
  initialData?: AboutPageData;
}

interface UseBlogPageOptions {
  initialData?: BlogPageData;
}

interface UseContactPageOptions {
  initialData?: ContactPageData;
}

export const useHomePage = ({ initialData }: UseHomePageOptions = {}) =>
  useQuery({
    queryKey: marketingKeys.pages.home(),
    queryFn: api.pages.getHome,
    initialData,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });

export const useProgramsPage = ({ initialData }: UseProgramsPageOptions = {}) =>
  useQuery({
    queryKey: marketingKeys.pages.programs(),
    queryFn: api.pages.getPrograms,
    initialData,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });

export const useAboutPage = ({ initialData }: UseAboutPageOptions = {}) =>
  useQuery({
    queryKey: marketingKeys.pages.about(),
    queryFn: api.pages.getAbout,
    initialData,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });

export const useBlogPage = ({ initialData }: UseBlogPageOptions = {}) =>
  useQuery({
    queryKey: marketingKeys.pages.blog(),
    queryFn: api.pages.getBlog,
    initialData,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });

export const useContactPage = ({ initialData }: UseContactPageOptions = {}) =>
  useQuery({
    queryKey: marketingKeys.pages.contact(),
    queryFn: api.pages.getContact,
    initialData,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });

import {
  HomePageData,
  ProgramsPageData,
  AboutPageData,
  BlogPageData,
  ContactPageData,
} from "@repo/api";
import { marketingKeys } from "@repo/query";
import { useQuery } from "@tanstack/react-query";

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
  });

export const useProgramsPage = ({ initialData }: UseProgramsPageOptions = {}) =>
  useQuery({
    queryKey: marketingKeys.pages.programs(),
    queryFn: api.pages.getPrograms,
    initialData,
  });

export const useAboutPage = ({ initialData }: UseAboutPageOptions = {}) =>
  useQuery({
    queryKey: marketingKeys.pages.about(),
    queryFn: api.pages.getAbout,
    initialData,
  });

export const useBlogPage = ({ initialData }: UseBlogPageOptions = {}) =>
  useQuery({
    queryKey: marketingKeys.pages.blog(),
    queryFn: api.pages.getBlog,
    initialData,
  });

export const useContactPage = ({ initialData }: UseContactPageOptions = {}) =>
  useQuery({
    queryKey: marketingKeys.pages.contact(),
    queryFn: api.pages.getContact,
    initialData,
  });

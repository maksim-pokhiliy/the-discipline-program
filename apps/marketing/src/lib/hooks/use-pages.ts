import { marketingKeys } from "@repo/query";
import { useQuery } from "@tanstack/react-query";

import { api } from "../api";

export const useHomePage = () =>
  useQuery({
    queryKey: marketingKeys.pages.home(),
    queryFn: api.pages.getHome,
  });

export const useProgramsPage = () =>
  useQuery({
    queryKey: marketingKeys.pages.programs(),
    queryFn: api.pages.getPrograms,
  });

export const useAboutPage = () =>
  useQuery({
    queryKey: marketingKeys.pages.about(),
    queryFn: api.pages.getAbout,
  });

export const useBlogPage = () =>
  useQuery({
    queryKey: marketingKeys.pages.blog(),
    queryFn: api.pages.getBlog,
  });

export const useContactPage = () =>
  useQuery({
    queryKey: marketingKeys.pages.contact(),
    queryFn: api.pages.getContact,
  });

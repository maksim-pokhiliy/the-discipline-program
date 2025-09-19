import { useQuery } from "@tanstack/react-query";

import { api } from "../api";

export const useHomePage = () =>
  useQuery({
    queryKey: ["marketing", "pages", "home"],
    queryFn: api.pages.getHome,
  });

export const useProgramsPage = () =>
  useQuery({
    queryKey: ["marketing", "pages", "programs"],
    queryFn: api.pages.getPrograms,
  });

export const useAboutPage = () =>
  useQuery({
    queryKey: ["marketing", "pages", "about"],
    queryFn: api.pages.getAbout,
  });

export const useBlogPage = () =>
  useQuery({
    queryKey: ["marketing", "pages", "blog"],
    queryFn: api.pages.getBlog,
  });

export const useContactPage = () =>
  useQuery({
    queryKey: ["marketing", "pages", "contact"],
    queryFn: api.pages.getContact,
  });

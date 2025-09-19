import { useQuery } from "@tanstack/react-query";

import { api } from "../api";

export const useBlogArticle = (slug: string) =>
  useQuery({
    queryKey: ["marketing", "blog-articles", slug],
    queryFn: () => api.pages.getBlogArticle(slug),
    enabled: !!slug,
  });

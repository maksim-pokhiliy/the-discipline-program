import { marketingKeys } from "@repo/query";
import { useQuery } from "@tanstack/react-query";

import { api } from "../api";

export const useBlogArticle = (slug: string) =>
  useQuery({
    queryKey: marketingKeys.blog.article(slug),
    queryFn: () => api.pages.getBlogArticle(slug),
    enabled: !!slug,
  });

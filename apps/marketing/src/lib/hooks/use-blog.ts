import { BlogPostPageData } from "@repo/api";
import { marketingKeys } from "@repo/query";
import { useQuery } from "@tanstack/react-query";

import { api } from "../api";

interface UseBlogArticleOptions {
  initialData?: BlogPostPageData;
}

export const useBlogArticle = (slug: string, { initialData }: UseBlogArticleOptions = {}) =>
  useQuery({
    queryKey: marketingKeys.blog.article(slug),
    queryFn: () => api.pages.getBlogArticle(slug),
    initialData,
    enabled: !!slug,
  });

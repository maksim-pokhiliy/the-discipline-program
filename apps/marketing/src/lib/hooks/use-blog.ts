"use client";

import { useQuery } from "@tanstack/react-query";

import { type BlogPostPageData } from "@repo/contracts/cms/blog";

import { api } from "../api";
import { marketingKeys } from "../api/keys";

type UseBlogArticleOptions = {
  initialData?: BlogPostPageData;
};

export const useBlogArticle = (slug: string, { initialData }: UseBlogArticleOptions = {}) =>
  useQuery({
    queryKey: marketingKeys.blog.article(slug),
    queryFn: () => api.pages.getBlogArticle(slug),
    initialData,
    enabled: !!slug,
  });

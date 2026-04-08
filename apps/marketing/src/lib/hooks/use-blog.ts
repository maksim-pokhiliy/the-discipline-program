"use client";

import { useQuery } from "@tanstack/react-query";

import { type BlogPostPageData } from "@repo/contracts/blog";
import { marketingKeys } from "@repo/query";

import { api } from "../api";

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

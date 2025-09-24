"use client";

import { AdminBlogPost } from "@repo/api";

export const formatPublishedAt = (date: Date | null): string => {
  if (!date) {
    return "Not published";
  }

  return new Date(date).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getMaxSortOrder = (posts: AdminBlogPost[]): number => {
  if (posts.length === 0) {
    return 0;
  }

  return Math.max(...posts.map((post) => post.sortOrder));
};

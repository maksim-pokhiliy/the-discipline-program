"use client";

import { Stack } from "@mui/material";

import { type AdminBlogPageData } from "@repo/contracts/blog";
import { QueryWrapper } from "@repo/query";

import { useBlogPageData } from "@app/lib/hooks";

import { BlogListSection, BlogStatsSection } from "../sections";

interface BlogListViewProps {
  initialData: AdminBlogPageData;
}

export const BlogListView = ({ initialData }: BlogListViewProps) => {
  const { data, isLoading, error } = useBlogPageData({ initialData });

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage="Loading posts...">
      {(data) => (
        <Stack spacing={0}>
          <BlogStatsSection stats={data.stats} />
          <BlogListSection posts={data.posts} />
        </Stack>
      )}
    </QueryWrapper>
  );
};

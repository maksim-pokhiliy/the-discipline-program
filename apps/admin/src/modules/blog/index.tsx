"use client";

import { Stack } from "@mui/material";

import { useBlogPageData } from "@app/lib/hooks";
import { QueryWrapper } from "@app/shared/components/providers";

import { BlogStatsSection, BlogTableSection } from "./sections";

export const BlogPage = () => {
  const { data, isLoading, error } = useBlogPageData();

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading blog posts..."
    >
      {(data) => (
        <Stack spacing={0}>
          <BlogStatsSection stats={data.stats} />
          <BlogTableSection posts={data.posts} />
        </Stack>
      )}
    </QueryWrapper>
  );
};

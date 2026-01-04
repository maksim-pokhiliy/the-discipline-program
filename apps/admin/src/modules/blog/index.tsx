"use client";

import { Stack } from "@mui/material";

import { type AdminBlogPageData } from "@repo/contracts/blog";
import { QueryWrapper } from "@repo/query";

import { useBlogPageData } from "@app/lib/hooks";

import { BlogStatsSection } from "./sections";

interface BlogPageClientProps {
  initialData: AdminBlogPageData;
}

export const BlogPageClient = ({ initialData }: BlogPageClientProps) => {
  const { data, isLoading, error } = useBlogPageData({ initialData });

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage="Loading posts...">
      {(data) => (
        <Stack spacing={0}>
          <BlogStatsSection stats={data.stats} />
        </Stack>
      )}
    </QueryWrapper>
  );
};

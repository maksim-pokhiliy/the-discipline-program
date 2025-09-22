"use client";

import { Stack } from "@mui/material";

import { useBlogPageData } from "@app/lib/hooks";
import { QueryWrapper } from "@app/shared/components/providers";

import { BlogStatsSection } from "./sections";

export const BlogPage = () => {
  const { data, isLoading, error } = useBlogPageData();

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage="Loading blog...">
      {(data) => (
        <Stack spacing={0}>
          <BlogStatsSection stats={data.stats} />
          {/* <ReviewsTableSection reviews={data.reviews} /> */}
        </Stack>
      )}
    </QueryWrapper>
  );
};

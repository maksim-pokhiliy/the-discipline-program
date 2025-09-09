"use client";

import { Stack } from "@mui/material";

import { useReviewsPageData } from "@app/lib/hooks";
import { QueryWrapper } from "@app/shared/components/providers";

import { ReviewsStatsSection, ReviewsTableSection } from "./sections";

export const ReviewsPage = () => {
  const { data, isLoading, error } = useReviewsPageData();

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading reviews..."
    >
      {(data) => (
        <Stack spacing={0}>
          <ReviewsStatsSection stats={data.stats} />
          <ReviewsTableSection reviews={data.reviews} />
        </Stack>
      )}
    </QueryWrapper>
  );
};

"use client";

import { Stack } from "@mui/material";

import { useReviewsPageData } from "@app/lib/hooks/use-admin-api";
import { QueryWrapper } from "@app/shared/components/ui/query-wrapper";

import { ReviewsStatsSection } from "./sections/reviews-stats-section";
import { ReviewsTableSection } from "./sections/reviews-table-section";

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

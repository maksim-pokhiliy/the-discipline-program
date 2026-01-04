"use client";

import { Stack } from "@mui/material";

import { type AdminReviewsPageData } from "@repo/contracts/review";
import { QueryWrapper } from "@repo/query";

import { useReviewsPageData } from "@app/lib/hooks";

import { ReviewsStatsSection } from "./sections";

interface ReviewsPageClientProps {
  initialData: AdminReviewsPageData;
}

export const ReviewsPageClient = ({ initialData }: ReviewsPageClientProps) => {
  const { data, isLoading, error } = useReviewsPageData({ initialData });

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
        </Stack>
      )}
    </QueryWrapper>
  );
};

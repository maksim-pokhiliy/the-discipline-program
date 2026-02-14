"use client";

import { useState } from "react";

import { Stack } from "@mui/material";

import { type AdminReviewsPageData } from "@repo/contracts/review";
import { QueryWrapper } from "@repo/query";

import { useReviewsPageData } from "@app/lib/hooks";

import { ReviewsListSection, ReviewsStatsSection } from "../../sections";

interface ReviewsListViewProps {
  initialData: AdminReviewsPageData;
}

export const ReviewsListView = ({ initialData }: ReviewsListViewProps) => {
  const { data, isLoading, error } = useReviewsPageData({ initialData });
  const [filter, setFilter] = useState<string | null>(null);

  const handleFilterChange = (key: string) => {
    setFilter((prev) => (prev === key ? null : key));
  };

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading reviews..."
    >
      {(data) => (
        <Stack>
          <ReviewsStatsSection
            stats={data.stats}
            selectedFilter={filter}
            onFilterChange={handleFilterChange}
          />
          <ReviewsListSection reviews={data.reviews} filter={filter} />
        </Stack>
      )}
    </QueryWrapper>
  );
};

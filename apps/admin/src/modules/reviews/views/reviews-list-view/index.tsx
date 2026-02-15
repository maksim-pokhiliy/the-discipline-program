"use client";

import { Container } from "@mui/material";

import { type AdminReviewsPageData } from "@repo/contracts/review";
import { QueryWrapper } from "@repo/query";

import { useReviewsPageData } from "@app/lib/hooks";

import { ReviewsListSection } from "../../sections";

interface ReviewsListViewProps {
  initialData: AdminReviewsPageData;
}

export const ReviewsListView = ({ initialData }: ReviewsListViewProps) => {
  const { data, isLoading, error } = useReviewsPageData({ initialData });

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading reviews..."
    >
      {(data) => (
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <ReviewsListSection reviews={data.reviews} />
        </Container>
      )}
    </QueryWrapper>
  );
};

"use client";

import { QueryWrapper } from "@repo/ui";

import { useReview } from "@app/lib/hooks";

import { ReviewsEditForm } from "./reviews-edit-form";

type ReviewsEditViewProps = {
  id: string;
};

export const ReviewsEditView: React.FC<ReviewsEditViewProps> = ({ id }) => {
  const { data, isLoading, error } = useReview(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading review..."
    >
      {(review) => <ReviewsEditForm review={review} />}
    </QueryWrapper>
  );
};

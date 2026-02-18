"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createReviewSchema, type CreateReviewData, type Review } from "@repo/contracts/review";
import { FormView } from "@repo/ui";

import { useReview, useUpdateReview } from "@app/lib/hooks";

import { ReviewForm } from "../../components";

interface ReviewsEditViewProps {
  initialData: Review;
}

export const ReviewsEditView = ({ initialData }: ReviewsEditViewProps) => {
  const { data: review } = useReview(initialData.id, initialData);
  const { mutate: updateReview, isPending } = useUpdateReview();

  const methods = useForm<CreateReviewData>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      authorName: review?.authorName || "",
      authorRole: review?.authorRole || "",
      authorAvatar: review?.authorAvatar || null,
      text: review?.text || "",
      rating: review?.rating || 5,
      isActive: review?.isActive || false,
    },
  });

  if (!review) {
    return null;
  }

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateReview({ id: review.id, data })}
      isPending={isPending}
      title="Edit Review"
      subtitle={review.authorName}
      backHref="/reviews"
      backLabel="Back to List"
    >
      <ReviewForm isLoading={isPending} />
    </FormView>
  );
};

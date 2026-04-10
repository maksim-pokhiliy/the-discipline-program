"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createReviewSchema, type CreateReviewData } from "@repo/contracts/cms/review";
import { FormView } from "@repo/ui";

import { useCreateReview } from "@app/lib/hooks";

import { ReviewForm } from "../../components";

export const ReviewsCreateView = () => {
  const { mutate: createReview, isPending } = useCreateReview();

  const methods = useForm<CreateReviewData>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      authorName: "",
      authorRole: "",
      authorAvatar: null,
      text: "",
      rating: 5,
      isActive: true,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createReview(data)}
      isPending={isPending}
      title="Create Review"
      subtitle="Add a new customer testimonial"
      backHref="/reviews"
      backLabel="Back to List"
      submitLabel="Create Review"
    >
      <ReviewForm isLoading={isPending} />
    </FormView>
  );
};

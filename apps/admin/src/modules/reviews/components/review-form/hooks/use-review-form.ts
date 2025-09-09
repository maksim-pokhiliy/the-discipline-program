"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Review } from "@repo/api";
import { useForm } from "react-hook-form";

import { FORM_DEFAULTS, ReviewFormData, reviewFormSchema } from "@app/modules/reviews/shared";

interface UseReviewFormProps {
  review?: Review | null;
  onSubmit: (data: ReviewFormData) => void;
  isSubmitting?: boolean;
}

export const useReviewForm = ({ review, onSubmit, isSubmitting }: UseReviewFormProps) => {
  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: review ?? FORM_DEFAULTS,
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  const handleRatingChange = (rating: number) => {
    setValue("rating", rating);
  };

  const handleAvatarChange = (avatarUrl: string) => {
    setValue("authorAvatar", avatarUrl);
  };

  return {
    form,
    control,
    errors,
    handleRatingChange,
    handleAvatarChange,
    handleSubmit: handleSubmit(onSubmit),
    isSubmitting: Boolean(isSubmitting),
  };
};

"use client";

import { Stack } from "@mui/material";
import { forwardRef, useImperativeHandle } from "react";

import { ReviewFormProps } from "../../shared";

import { AvatarField, BasicFields, RatingField, SettingsFields } from "./fields";
import { useReviewForm } from "./hooks/use-review-form";

export interface ReviewFormRef {
  submit: () => void;
}

export const ReviewForm = forwardRef<ReviewFormRef, ReviewFormProps>(
  ({ review, onSubmit, isSubmitting = false, programs = [] }, ref) => {
    const {
      control,
      errors,
      handleSubmit,
      isSubmitting: formIsSubmitting,
    } = useReviewForm({ review, onSubmit, isSubmitting });

    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
    }));

    return (
      <Stack spacing={4}>
        <BasicFields
          control={control}
          errors={errors}
          isSubmitting={formIsSubmitting}
          programs={programs}
        />

        <RatingField control={control} errors={errors} isSubmitting={formIsSubmitting} />

        <AvatarField control={control} errors={errors} isSubmitting={formIsSubmitting} />

        <SettingsFields control={control} errors={errors} isSubmitting={formIsSubmitting} />
      </Stack>
    );
  },
);

ReviewForm.displayName = "ReviewForm";

export type { ReviewFormData } from "../../shared/types";

"use client";

import { Review } from "@repo/api";
import { useState } from "react";

import { useReviewMutations } from "@app/lib/hooks/use-admin-api";

import { ReviewFormData } from "../../shared/types";

interface UseReviewModalProps {
  review?: Review | null;
  onClose: () => void;
}

export const useReviewModal = ({ review, onClose }: UseReviewModalProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { createReview, updateReview } = useReviewMutations();

  const isEditing = Boolean(review && review.id);
  const isDuplicating = Boolean(review && !review.id);
  const isSubmitting = createReview.isPending || updateReview.isPending;

  const handleSubmit = async (data: ReviewFormData) => {
    setSubmitError(null);

    try {
      const submitData = {
        ...data,
        authorAvatar: data.authorAvatar?.trim(),
        programId: data.programId?.trim() || null,
      };

      if (isEditing && review) {
        await updateReview.mutateAsync({
          id: review.id,
          data: submitData,
        });
      } else {
        await createReview.mutateAsync(submitData);
      }

      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save review";

      setSubmitError(errorMessage);
      console.error("Failed to save review:", error);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSubmitError(null);
      onClose();
    }
  };

  return {
    isEditing,
    isDuplicating,
    isSubmitting,
    submitError,
    handleSubmit,
    handleClose,
  };
};

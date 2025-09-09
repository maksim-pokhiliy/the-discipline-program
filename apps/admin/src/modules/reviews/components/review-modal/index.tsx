"use client";

import { FormModal } from "@repo/ui";
import { FormEvent, useRef } from "react";

import { usePrograms } from "@app/lib/hooks";

import { ReviewModalProps } from "../../shared";
import { ReviewForm, ReviewFormRef } from "../review-form";

import { useReviewModal } from "./hooks/use-review-modal";

export const ReviewModal = ({ open, onClose, review }: ReviewModalProps) => {
  const { isEditing, isDuplicating, isSubmitting, submitError, handleSubmit, handleClose } =
    useReviewModal({
      review,
      onClose,
    });

  const { data: programs } = usePrograms();

  const formRef = useRef<ReviewFormRef>(null);

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    formRef.current?.submit();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title={isEditing ? "Edit Review" : isDuplicating ? "Duplicate Review" : "Create New Review"}
      onSubmit={handleFormSubmit}
      isSubmitting={isSubmitting}
      submitText={
        isEditing ? "Update Review" : isDuplicating ? "Duplicate Review" : "Create Review"
      }
      error={submitError}
      maxWidth="md"
    >
      <ReviewForm
        ref={formRef}
        review={review}
        programs={programs || []}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </FormModal>
  );
};

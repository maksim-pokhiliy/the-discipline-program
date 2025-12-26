"use client";

import { Review } from "@repo/api";
import { ConfirmationModal } from "@repo/ui";

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  review: Review | null;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
  error?: string | null;
}

export const DeleteConfirmationModal = ({
  open,
  onClose,
  review,
  onConfirm,
  isDeleting = false,
  error,
}: DeleteConfirmationModalProps) => {
  if (!review) {
    return null;
  }

  return (
    <ConfirmationModal
      open={open}
      onClose={onClose}
      title="Delete Review"
      type="danger"
      message={`Are you sure you want to delete the review by "${review.authorName}"?`}
      details="This action cannot be undone. The review will be permanently removed from the system."
      onConfirm={onConfirm}
      confirmText="Delete Review"
      isConfirming={isDeleting}
      error={error}
    />
  );
};

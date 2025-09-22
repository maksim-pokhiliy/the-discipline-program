"use client";

import { AdminBlogPost } from "@repo/api";
import { ConfirmationModal } from "@repo/ui";

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  post: AdminBlogPost | null;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
  error?: string | null;
}

export const DeleteConfirmationModal = ({
  open,
  onClose,
  post,
  onConfirm,
  isDeleting = false,
  error,
}: DeleteConfirmationModalProps) => {
  if (!post) return null;

  return (
    <ConfirmationModal
      open={open}
      onClose={onClose}
      title="Delete Blog Post"
      type="danger"
      message={`Are you sure you want to delete "${post.title}"?`}
      details="This action cannot be undone. The article and its media references will be permanently removed."
      onConfirm={onConfirm}
      confirmText="Delete Post"
      isConfirming={isDeleting}
      error={error}
    />
  );
};

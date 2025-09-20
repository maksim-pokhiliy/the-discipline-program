"use client";

import { BlogPost } from "@repo/api";
import { ConfirmationModal } from "@repo/ui";

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  post: BlogPost | null;
  onConfirm: () => void;
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

  const isPublished = post.isPublished;

  return (
    <ConfirmationModal
      open={open}
      onClose={onClose}
      title="Delete Blog Post"
      type={isPublished ? "warning" : "danger"}
      message={
        isPublished
          ? `Cannot delete published post "${post.title}"`
          : `Are you sure you want to delete "${post.title}"?`
      }
      details={
        isPublished
          ? "Please unpublish this post first before deleting it."
          : "This action cannot be undone. The post will be permanently removed from the system."
      }
      onConfirm={isPublished ? onClose : onConfirm}
      confirmText={isPublished ? "OK" : "Delete Post"}
      showCancel={!isPublished}
      isConfirming={isDeleting}
      error={error}
    />
  );
};

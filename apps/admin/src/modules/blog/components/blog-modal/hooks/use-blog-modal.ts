"use client";

import { AdminBlogPost } from "@repo/api";
import { useState } from "react";

import type { BlogPayload } from "@app/lib/api/endpoints/blog";
import { useBlogMutations } from "@app/lib/hooks";
import { BlogFormData } from "@app/modules/blog/shared";

interface UseBlogModalProps {
  post?: AdminBlogPost | null;
  onClose: () => void;
}

export const useBlogModal = ({ post, onClose }: UseBlogModalProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { createPost, updatePost } = useBlogMutations();

  const isEditing = Boolean(post && post.id);
  const isDuplicating = Boolean(post && !post.id);
  const isSubmitting = createPost.isPending || updatePost.isPending;

  const handleSubmit = async (data: BlogFormData) => {
    setSubmitError(null);

    try {
      const payload: BlogPayload = {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      };

      if (isEditing && post?.id) {
        await updatePost.mutateAsync({
          id: post.id,
          data: payload,
        });
      } else {
        await createPost.mutateAsync(payload);
      }

      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save blog post";

      setSubmitError(message);
      console.error("Failed to save blog post:", error);
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

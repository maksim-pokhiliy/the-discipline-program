"use client";

import { FormModal } from "@repo/ui";
import { FormEvent, useRef } from "react";

import { BlogModalProps } from "@app/modules/blog/shared";

import { BlogForm, BlogFormRef } from "../blog-form";

import { useBlogModal } from "./hooks/use-blog-modal";

export const BlogModal = ({ open, onClose, post }: BlogModalProps) => {
  const { isEditing, isDuplicating, isSubmitting, submitError, handleSubmit, handleClose } =
    useBlogModal({ post, onClose });

  const formRef = useRef<BlogFormRef>(null);

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    formRef.current?.submit();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title={
        isEditing
          ? "Edit Blog Post"
          : isDuplicating
            ? "Duplicate Blog Post"
            : "Create New Blog Post"
      }
      onSubmit={handleFormSubmit}
      isSubmitting={isSubmitting}
      submitText={isEditing ? "Update Post" : isDuplicating ? "Duplicate Post" : "Create Post"}
      error={submitError}
      maxWidth="lg"
    >
      <BlogForm ref={formRef} post={post} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </FormModal>
  );
};

"use client";

import { Stack } from "@mui/material";
import { forwardRef, useImperativeHandle } from "react";

import { BlogFormProps } from "@app/modules/blog/shared";

import { BasicFields } from "./fields/basic-fields";
import { ContentField } from "./fields/content-field";
import { MediaField } from "./fields/media-field";
import { SettingsField } from "./fields/settings-field";
import { TagsField } from "./fields/tags-field";
import { useBlogForm } from "./hooks/use-blog-form";

export interface BlogFormRef {
  submit: () => void;
}

export const BlogForm = forwardRef<BlogFormRef, BlogFormProps>(
  ({ post, onSubmit, isSubmitting = false }, ref) => {
    const {
      control,
      errors,
      handleSubmit,
      isSubmitting: formIsSubmitting,
      slugGeneration,
      handleSlugChange,
      handleTagsChange,
      handleCoverChange,
      handlePublishedAtChange,
    } = useBlogForm({ post, onSubmit, isSubmitting });

    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
    }));

    return (
      <Stack spacing={4}>
        <BasicFields
          control={control}
          errors={errors}
          isSubmitting={formIsSubmitting}
          isSlugManuallyChanged={slugGeneration.isManuallyChanged}
          onSlugManualChange={handleSlugChange}
        />

        <ContentField control={control} errors={errors} isSubmitting={formIsSubmitting} />

        <MediaField
          control={control}
          errors={errors}
          isSubmitting={formIsSubmitting}
          onCoverChange={handleCoverChange}
        />

        <TagsField
          control={control}
          errors={errors}
          isSubmitting={formIsSubmitting}
          onTagsChange={handleTagsChange}
        />

        <SettingsField
          control={control}
          errors={errors}
          isSubmitting={formIsSubmitting}
          onPublishedAtChange={handlePublishedAtChange}
        />
      </Stack>
    );
  },
);

BlogForm.displayName = "BlogForm";

export type { BlogFormData } from "@app/modules/blog/shared";

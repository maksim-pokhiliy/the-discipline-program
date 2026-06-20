"use client";

import { useMemo } from "react";

import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import dynamic from "next/dynamic";
import { Controller, useFormContext } from "react-hook-form";

import {
  BLOG_CATEGORY_LABELS,
  BLOG_CONSTANTS,
  BlogCategory,
  type CreateBlogPostData,
} from "@repo/contracts/cms/blog";
import { UPLOAD_CONFIG } from "@repo/contracts/storage/upload";
import { ImageUpload, TagsInput } from "@repo/ui";

const MarkdownEditor = dynamic(
  () => import("@repo/ui").then((m) => ({ default: m.MarkdownEditor })),
  { ssr: false },
);

import { FormCard } from "@app/lib/components/form-card";
import { useAutoSlug, useUploadImage } from "@app/lib/hooks";

type BlogPostFormProps = {
  isLoading?: boolean;
  disableAutoSlug?: boolean;
};

export const BlogPostForm = ({ isLoading = false, disableAutoSlug = false }: BlogPostFormProps) => {
  const form = useFormContext<CreateBlogPostData>();
  const {
    register,
    watch,
    setValue,
    control,
    formState: { errors },
  } = form;

  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();

  useAutoSlug({ disabled: disableAutoSlug, form });

  const content = watch("content");
  const excerpt = watch("excerpt");

  const wordCount = useMemo(() => {
    if (!content) {
      return 0;
    }

    const text = content.replace(/<[^>]*>?/gm, "");

    return text.trim().split(/\s+/).length;
  }, [content]);

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <FormCard title="Post Content">
          <Stack spacing={3}>
            <TextField
              label="Post Title"
              placeholder="Enter title here"
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!errors.title}
              helperText={errors.title?.message}
              {...register("title")}
            />

            <Stack spacing={1}>
              <Controller
                name="content"
                control={control}
                render={({ field, fieldState }) => (
                  <MarkdownEditor
                    label="Content"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Write your article content..."
                    disabled={isLoading}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    minRows={20}
                  />
                )}
              />

              <Typography variant="caption" color="text.secondary" align="right">
                {wordCount} words
              </Typography>
            </Stack>
          </Stack>
        </FormCard>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={3}>
          <FormCard title="Publishing">
            <Stack spacing={1}>
              <Controller
                name="isPublished"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!field.value}
                        onChange={field.onChange}
                        size="small"
                        disabled={isLoading}
                      />
                    }
                    label="Published"
                  />
                )}
              />

              <Controller
                name="isFeatured"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!field.value}
                        onChange={field.onChange}
                        size="small"
                        disabled={isLoading}
                      />
                    }
                    label="Featured Post"
                  />
                )}
              />
            </Stack>
          </FormCard>

          <FormCard title="URL Settings">
            <Controller
              name="slug"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Slug"
                  variant="outlined"
                  fullWidth
                  size="small"
                  disabled={isLoading}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Allowed: a-z, 0-9, -"}
                />
              )}
            />
          </FormCard>

          <FormCard title="Organization">
            <Stack spacing={3}>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small" error={!!errors.category}>
                    <InputLabel>Category</InputLabel>

                    <Select label="Category" {...field} disabled={isLoading}>
                      {Object.values(BlogCategory).map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {BLOG_CATEGORY_LABELS[cat]}
                        </MenuItem>
                      ))}
                    </Select>

                    {errors.category && <FormHelperText>{errors.category.message}</FormHelperText>}
                  </FormControl>
                )}
              />

              <Controller
                name="tags"
                control={control}
                render={({ field, fieldState }) => (
                  <TagsInput
                    value={field.value}
                    onChange={field.onChange}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    disabled={isLoading}
                    size="small"
                  />
                )}
              />

              <TextField
                label="Author Name"
                variant="outlined"
                fullWidth
                size="small"
                disabled={isLoading}
                error={!!errors.authorName}
                helperText={errors.authorName?.message}
                {...register("authorName")}
              />
            </Stack>
          </FormCard>

          <FormCard title="Featured Image">
            <Stack spacing={2}>
              <ImageUpload
                previewUrl={watch("coverImage") || ""}
                isUploading={isUploading}
                disabled={isLoading}
                maxSizeBytes={UPLOAD_CONFIG.blog.maxSize}
                acceptedTypes={[...UPLOAD_CONFIG.blog.acceptedTypes]}
                onFileSelect={(file) => {
                  uploadImage(
                    { file, context: "blog" },
                    {
                      onSuccess: (res) => setValue("coverImage", res.url, { shouldDirty: true }),
                    },
                  );
                }}
                onRemove={() => {
                  setValue("coverImage", "", { shouldDirty: true });
                }}
              />
            </Stack>
          </FormCard>

          <FormCard title="Excerpt">
            <TextField
              label="Summary"
              placeholder="Used for SEO and previews..."
              multiline
              minRows={3}
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!errors.excerpt}
              helperText={
                <Stack direction="row" justifyContent="space-between" component="span" width="100%">
                  <Typography variant="caption" component="span">
                    {errors.excerpt?.message || "Short description"}
                  </Typography>

                  <Typography variant="caption" component="span">
                    {excerpt?.length || 0}/{BLOG_CONSTANTS.MAX_EXCERPT_LENGTH}
                  </Typography>
                </Stack>
              }
              {...register("excerpt")}
            />
          </FormCard>
        </Stack>
      </Grid>
    </Grid>
  );
};

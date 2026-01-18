"use client";

import { useEffect, useMemo } from "react";

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
import { Controller, useFormContext } from "react-hook-form";

import { BLOG_CATEGORIES, type CreateBlogPostData } from "@repo/contracts/blog";
import { UPLOAD_CONFIG } from "@repo/contracts/upload";
import { FormCard, ImageUpload, TagsInput } from "@repo/ui";

import { useUploadImage } from "@app/lib/hooks";

import { slugify } from "../utils/helpers";

interface BlogPostFormProps {
  isLoading?: boolean;
}

export const BlogPostForm = ({ isLoading = false }: BlogPostFormProps) => {
  const {
    register,
    watch,
    setValue,
    control,
    formState: { errors, dirtyFields },
  } = useFormContext<CreateBlogPostData>();

  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();

  const title = watch("title");
  const content = watch("content");
  const excerpt = watch("excerpt");

  useEffect(() => {
    if (title && !dirtyFields.slug) {
      setValue("slug", slugify(title), { shouldValidate: true });
    }
  }, [title, dirtyFields.slug, setValue]);

  const wordCount = useMemo(() => {
    return content ? content.trim().split(/\s+/).length : 0;
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
              <TextField
                label="Content"
                placeholder="Write your article content (Markdown supported)..."
                variant="outlined"
                fullWidth
                multiline
                minRows={20}
                size="small"
                disabled={isLoading}
                error={!!errors.content}
                helperText={errors.content?.message}
                sx={{
                  "& .MuiInputBase-root": {
                    fontFamily: "monospace",
                  },
                }}
                {...register("content")}
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
              <FormControlLabel
                control={
                  <Checkbox {...register("isPublished")} size="small" disabled={isLoading} />
                }
                label="Published"
              />

              <FormControlLabel
                control={<Checkbox {...register("isFeatured")} size="small" disabled={isLoading} />}
                label="Featured Post"
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
              <FormControl fullWidth size="small" error={!!errors.category}>
                <InputLabel>Category</InputLabel>

                <Select
                  label="Category"
                  defaultValue="Uncategorized"
                  {...register("category")}
                  disabled={isLoading}
                >
                  <MenuItem value="Uncategorized">Uncategorized</MenuItem>

                  {BLOG_CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>

                {errors.category && <FormHelperText>{errors.category.message}</FormHelperText>}
              </FormControl>

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
                onRemove={() => setValue("coverImage", "", { shouldDirty: true })}
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
                    {excerpt?.length || 0}/500
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

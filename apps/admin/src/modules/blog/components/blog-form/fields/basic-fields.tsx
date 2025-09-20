"use client";

import { Button, MenuItem, Stack, TextField } from "@mui/material";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { BlogFormData, BLOG_AUTHORS, BLOG_CATEGORIES } from "@app/modules/blog/shared";

interface BasicFieldsProps {
  control: Control<BlogFormData>;
  errors: FieldErrors<BlogFormData>;
  isSubmitting: boolean;
  onSlugGenerate?: () => void;
}

export const BasicFields = ({
  control,
  errors,
  isSubmitting,
  onSlugGenerate,
}: BasicFieldsProps) => {
  return (
    <Stack spacing={3}>
      <Controller
        name="title"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Title"
            error={!!errors.title}
            helperText={errors.title?.message}
            required
            fullWidth
            disabled={isSubmitting}
            placeholder="Enter post title"
          />
        )}
      />

      <Stack direction="row" spacing={2}>
        <Controller
          name="slug"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Slug (URL)"
              error={!!errors.slug}
              helperText={errors.slug?.message || "URL-friendly version of the title"}
              fullWidth
              disabled={isSubmitting}
              placeholder="post-url-slug"
            />
          )}
        />

        {onSlugGenerate && (
          <Button
            variant="outlined"
            onClick={onSlugGenerate}
            disabled={isSubmitting}
            sx={{ minWidth: 120 }}
          >
            Generate
          </Button>
        )}
      </Stack>

      <Controller
        name="excerpt"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Excerpt"
            error={!!errors.excerpt}
            helperText={errors.excerpt?.message || "Brief description for listings and SEO"}
            fullWidth
            multiline
            rows={2}
            disabled={isSubmitting}
            placeholder="Brief description of the post..."
          />
        )}
      />

      <Stack direction="row" spacing={2}>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Category"
              error={!!errors.category}
              helperText={errors.category?.message}
              required
              fullWidth
              disabled={isSubmitting}
            >
              {BLOG_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Controller
          name="author"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Author"
              error={!!errors.author}
              helperText={errors.author?.message}
              required
              fullWidth
              disabled={isSubmitting}
            >
              {BLOG_AUTHORS.map((author) => (
                <MenuItem key={author} value={author}>
                  {author}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Stack>
    </Stack>
  );
};

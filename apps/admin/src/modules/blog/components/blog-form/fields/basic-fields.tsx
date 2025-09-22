"use client";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Alert, Stack, TextField, Typography } from "@mui/material";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { BlogFormInputs } from "@app/modules/blog/shared";

interface BasicFieldsProps {
  control: Control<BlogFormInputs, unknown>;
  errors: FieldErrors<BlogFormInputs>;
  isSubmitting: boolean;
  isSlugManuallyChanged: boolean;
  onSlugManualChange: (value: string) => string;
}

export const BasicFields = ({
  control,
  errors,
  isSubmitting,
  isSlugManuallyChanged,
  onSlugManualChange,
}: BasicFieldsProps) => {
  return (
    <Stack spacing={3}>
      <Typography variant="h6">Basic Information</Typography>

      <Controller
        name="title"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Title"
            fullWidth
            error={!!errors.title}
            helperText={errors.title?.message}
            disabled={isSubmitting}
            placeholder="Write a compelling article title"
          />
        )}
      />

      <Controller
        name="slug"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Slug"
            fullWidth
            error={!!errors.slug}
            helperText={errors.slug?.message || "Used for the article URL"}
            disabled={isSubmitting}
            onChange={(event) => {
              const value = onSlugManualChange(event.target.value);

              field.onChange(value);
            }}
          />
        )}
      />

      {!isSlugManuallyChanged && (
        <Alert icon={<InfoOutlinedIcon fontSize="small" />} severity="info" variant="outlined">
          Slug will be generated automatically from the title. Enter a value above to override it.
        </Alert>
      )}

      <Controller
        name="excerpt"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Excerpt"
            fullWidth
            multiline
            minRows={3}
            error={!!errors.excerpt}
            helperText={errors.excerpt?.message || "Short summary shown on listings"}
            disabled={isSubmitting}
          />
        )}
      />

      <Controller
        name="author"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Author"
            fullWidth
            error={!!errors.author}
            helperText={errors.author?.message}
            disabled={isSubmitting}
          />
        )}
      />

      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Category"
            fullWidth
            error={!!errors.category}
            helperText={errors.category?.message}
            disabled={isSubmitting}
            placeholder="e.g. Mindset, Productivity"
          />
        )}
      />
    </Stack>
  );
};

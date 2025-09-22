"use client";

import { Stack, TextField, Typography } from "@mui/material";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { BlogFormInputs } from "@app/modules/blog/shared";

interface ContentFieldProps {
  control: Control<BlogFormInputs, unknown>;
  errors: FieldErrors<BlogFormInputs>;
  isSubmitting: boolean;
}

export const ContentField = ({ control, errors, isSubmitting }: ContentFieldProps) => {
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Content</Typography>

      <Controller
        name="content"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Article Content"
            fullWidth
            multiline
            minRows={8}
            error={!!errors.content}
            helperText={errors.content?.message || "You can use Markdown syntax"}
            disabled={isSubmitting}
          />
        )}
      />
    </Stack>
  );
};

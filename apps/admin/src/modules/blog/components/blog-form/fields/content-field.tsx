"use client";

import { Box, TextField, Typography } from "@mui/material";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { BlogFormData } from "@app/modules/blog/shared";
import { calculateReadTime } from "@app/modules/blog/utils";

interface ContentFieldProps {
  control: Control<BlogFormData>;
  errors: FieldErrors<BlogFormData>;
  isSubmitting: boolean;
}

export const ContentField = ({ control, errors, isSubmitting }: ContentFieldProps) => {
  return (
    <Box>
      <Controller
        name="content"
        control={control}
        render={({ field }) => (
          <>
            <TextField
              {...field}
              label="Content"
              error={!!errors.content}
              helperText={errors.content?.message}
              required
              fullWidth
              multiline
              rows={20}
              disabled={isSubmitting}
              placeholder="Write your blog post content here..."
            />

            {field.value && (
              <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="text.secondary">
                  {field.value.split(/\s+/).length} words
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  ~{calculateReadTime(field.value)} min read
                </Typography>
              </Box>
            )}
          </>
        )}
      />
    </Box>
  );
};

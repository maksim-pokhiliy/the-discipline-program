"use client";

import { Autocomplete, Chip, TextField } from "@mui/material";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { BlogFormData, POPULAR_TAGS } from "@app/modules/blog/shared";

interface TagsFieldProps {
  control: Control<BlogFormData>;
  errors: FieldErrors<BlogFormData>;
  isSubmitting: boolean;
}

export const TagsField = ({ control, errors, isSubmitting }: TagsFieldProps) => {
  return (
    <Controller
      name="tags"
      control={control}
      render={({ field }) => (
        <Autocomplete
          multiple
          freeSolo
          options={POPULAR_TAGS as unknown as string[]}
          value={field.value}
          onChange={(_, newValue) => field.onChange(newValue)}
          disabled={isSubmitting}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                size="small"
                {...getTagProps({ index })}
                key={option}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tags"
              placeholder="Add tags..."
              error={!!errors.tags}
              helperText={errors.tags?.message || "Press Enter to add custom tags"}
            />
          )}
        />
      )}
    />
  );
};

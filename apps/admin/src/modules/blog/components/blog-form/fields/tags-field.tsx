"use client";

import LabelIcon from "@mui/icons-material/Label";
import { Autocomplete, Chip, Stack, TextField, Typography } from "@mui/material";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { BlogFormInputs } from "@app/modules/blog/shared";

interface TagsFieldProps {
  control: Control<BlogFormInputs, unknown>;
  errors: FieldErrors<BlogFormInputs>;
  isSubmitting: boolean;
  onTagsChange: (tags: string[]) => void;
}

export const TagsField = ({ control, errors, isSubmitting, onTagsChange }: TagsFieldProps) => {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <LabelIcon fontSize="small" color="primary" />
        <Typography variant="h6">Tags</Typography>
      </Stack>

      <Controller
        name="tags"
        control={control}
        render={({ field }) => (
          <Autocomplete
            multiple
            freeSolo
            options={field.value || []}
            value={field.value || []}
            onChange={(_, newValue) => {
              const normalized = newValue.map((tag) => tag.trim()).filter(Boolean);

              field.onChange(normalized);
              onTagsChange(normalized);
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option}
                  label={option}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder="Press Enter to add tag"
                error={!!errors.tags}
                helperText={errors.tags?.message}
                disabled={isSubmitting}
              />
            )}
          />
        )}
      />
    </Stack>
  );
};

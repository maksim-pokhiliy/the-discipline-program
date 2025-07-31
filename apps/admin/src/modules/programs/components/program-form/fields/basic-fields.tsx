import { TextField, Stack, Typography } from "@mui/material";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { ProgramFormData } from "../../shared/types";

interface BasicFieldsProps {
  control: Control<ProgramFormData>;
  errors: FieldErrors<ProgramFormData>;
  isSubmitting: boolean;
  onSlugChange: (value: string) => string;
}

export const BasicFields = ({ control, errors, isSubmitting, onSlugChange }: BasicFieldsProps) => {
  return (
    <Stack spacing={3}>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Program Name"
            error={!!errors.name}
            helperText={errors.name?.message}
            required
            fullWidth
            disabled={isSubmitting}
            size="small"
          />
        )}
      />

      <Controller
        name="slug"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            onChange={(e) => field.onChange(onSlugChange(e.target.value))}
            label="Slug"
            error={!!errors.slug}
            helperText={
              errors.slug?.message || "URL-friendly identifier (auto-generated from name)"
            }
            required
            fullWidth
            size="small"
            disabled={isSubmitting}
            slotProps={{
              input: {
                startAdornment: (
                  <Typography variant="body2" color="text.secondary">
                    /{"\u00A0"}
                  </Typography>
                ),
              },
            }}
          />
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Description"
            error={!!errors.description}
            helperText={errors.description?.message}
            required
            fullWidth
            multiline
            rows={4}
            disabled={isSubmitting}
            size="small"
          />
        )}
      />
    </Stack>
  );
};

"use client";

import { TextField, FormControlLabel, Checkbox, Stack, Typography } from "@mui/material";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { ReviewFormData } from "../../../shared/types";

interface SettingsFieldsProps {
  control: Control<ReviewFormData>;
  errors: FieldErrors<ReviewFormData>;
  isSubmitting: boolean;
}

export const SettingsFields = ({ control, errors, isSubmitting }: SettingsFieldsProps) => {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3} alignItems="center">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={field.value} disabled={isSubmitting} />}
              label="Active"
              sx={{ m: 0 }}
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
                  {...field}
                  checked={field.value}
                  disabled={isSubmitting}
                  color="secondary"
                />
              }
              label="Featured"
              sx={{ m: 0 }}
            />
          )}
        />

        <Controller
          name="sortOrder"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              label="Sort Order"
              type="number"
              error={!!errors.sortOrder}
              helperText={errors.sortOrder?.message}
              size="small"
              slotProps={{ htmlInput: { min: 0 } }}
              sx={{ width: 120 }}
              disabled={isSubmitting}
            />
          )}
        />
      </Stack>

      <Stack spacing={1}>
        <Typography variant="caption" color="text.secondary">
          • <strong>Active:</strong> Review is visible on the website
        </Typography>

        <Typography variant="caption" color="text.secondary">
          • <strong>Featured:</strong> Review appears on homepage and has priority display
        </Typography>

        <Typography variant="caption" color="text.secondary">
          • <strong>Sort Order:</strong> Lower numbers appear first (drag & drop also available in
          table)
        </Typography>
      </Stack>
    </Stack>
  );
};

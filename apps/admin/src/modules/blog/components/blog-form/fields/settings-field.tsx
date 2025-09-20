"use client";

import { FormControlLabel, Stack, Switch, TextField } from "@mui/material";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { BlogFormData } from "@app/modules/blog/shared";

interface SettingsFieldProps {
  control: Control<BlogFormData>;
  errors: FieldErrors<BlogFormData>;
  isSubmitting: boolean;
}

export const SettingsField = ({ control, errors, isSubmitting }: SettingsFieldProps) => {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Controller
          name="isPublished"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  color="success"
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
                <Switch
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  color="warning"
                />
              }
              label="Featured"
            />
          )}
        />
      </Stack>

      <Controller
        name="sortOrder"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            type="number"
            label="Sort Order"
            error={!!errors.sortOrder}
            helperText={errors.sortOrder?.message || "Lower numbers appear first"}
            disabled={isSubmitting}
            sx={{ maxWidth: 200 }}
            InputProps={{
              inputProps: { min: 0 },
            }}
            onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
          />
        )}
      />
    </Stack>
  );
};

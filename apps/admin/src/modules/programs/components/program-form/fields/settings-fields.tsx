"use client";

import { Checkbox, FormControlLabel, Stack, TextField } from "@mui/material";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { ProgramFormData } from "@app/modules/programs/shared";

interface SettingsFieldsProps {
  control: Control<ProgramFormData>;
  errors: FieldErrors<ProgramFormData>;
  isSubmitting: boolean;
}

export const SettingsFields = ({ control, errors, isSubmitting }: SettingsFieldsProps) => {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Controller
        name="isActive"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={<Checkbox {...field} checked={field.value} disabled={isSubmitting} />}
            label="Active Program"
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
  );
};

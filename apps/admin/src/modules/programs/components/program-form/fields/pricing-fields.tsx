"use client";

import { TextField, Stack, MenuItem } from "@mui/material";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { CURRENCIES } from "../../shared/constants";
import { ProgramFormData } from "../../shared/types";

interface PricingFieldsProps {
  control: Control<ProgramFormData>;
  errors: FieldErrors<ProgramFormData>;
  isSubmitting: boolean;
}

export const PricingFields = ({ control, errors, isSubmitting }: PricingFieldsProps) => {
  return (
    <Stack direction="row" spacing={2}>
      <Controller
        name="price"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            label="Price"
            type="number"
            error={!!errors.price}
            helperText={errors.price?.message}
            required
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            sx={{ flex: 2 }}
            disabled={isSubmitting}
            size="small"
          />
        )}
      />

      <Controller
        name="currency"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            select
            label="Currency"
            sx={{ flex: 1 }}
            disabled={isSubmitting}
            size="small"
          >
            {CURRENCIES.map((currency) => (
              <MenuItem key={currency.value} value={currency.value}>
                {currency.label}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
    </Stack>
  );
};

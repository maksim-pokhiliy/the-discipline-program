"use client";

import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";
import { Controller, useFormContext, type FieldError, type FieldPath } from "react-hook-form";

import { type CreateExerciseData } from "@repo/contracts/cms/exercise";

type EnumSelectFieldProps = {
  name: Extract<FieldPath<CreateExerciseData>, "primaryEquipment" | "movementTypeTagPrimary">;
  label: string;
  labels: Record<string, string>;
  error: FieldError | undefined;
  isLoading: boolean;
};

export const EnumSelectField = ({
  name,
  label,
  labels,
  error,
  isLoading,
}: EnumSelectFieldProps) => {
  const { control } = useFormContext<CreateExerciseData>();

  return (
    <FormControl fullWidth size="small" error={!!error}>
      <InputLabel>{label}</InputLabel>

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select {...field} label={label} disabled={isLoading}>
            {Object.entries(labels).map(([value, optionLabel]) => (
              <MenuItem key={value} value={value}>
                {optionLabel}
              </MenuItem>
            ))}
          </Select>
        )}
      />

      {error && <FormHelperText>{error.message}</FormHelperText>}
    </FormControl>
  );
};

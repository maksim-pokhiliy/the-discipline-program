"use client";

import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";
import { Controller, useFormContext, type FieldError } from "react-hook-form";

import { type CreateExerciseData, type ExerciseMovementType } from "@repo/contracts/cms/exercise";

import { MOVEMENT_TYPE_LABELS } from "../constants";

const SECONDARY_NONE = "__none__";

type SecondaryMovementSelectProps = {
  error: FieldError | undefined;
  isLoading: boolean;
};

export const SecondaryMovementSelect = ({ error, isLoading }: SecondaryMovementSelectProps) => {
  const { control } = useFormContext<CreateExerciseData>();

  return (
    <FormControl fullWidth size="small" error={!!error}>
      <InputLabel>Secondary Movement Type</InputLabel>

      <Controller
        name="movementTypeTagSecondary"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            label="Secondary Movement Type"
            disabled={isLoading}
            value={field.value ?? SECONDARY_NONE}
            onChange={(event) => {
              const next = event.target.value;

              field.onChange(next === SECONDARY_NONE ? null : (next as ExerciseMovementType));
            }}
          >
            <MenuItem value={SECONDARY_NONE}>None</MenuItem>

            {Object.entries(MOVEMENT_TYPE_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        )}
      />

      {error && <FormHelperText>{error.message}</FormHelperText>}
    </FormControl>
  );
};

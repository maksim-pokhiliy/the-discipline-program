"use client";

import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";
import { Controller, useFormContext, type FieldError } from "react-hook-form";

import {
  EXERCISE_MOVEMENT_TYPE,
  type CreateExerciseData,
  type ExerciseMovementType,
} from "@repo/contracts/cms/exercise";

import { MOVEMENT_TYPE_LABELS } from "../constants";

const SECONDARY_NONE = "__none__";

const MOVEMENT_TYPE_SET = new Set<string>(EXERCISE_MOVEMENT_TYPE);

const isMovementType = (value: unknown): value is ExerciseMovementType =>
  typeof value === "string" && MOVEMENT_TYPE_SET.has(value);

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
            label="Secondary Movement Type"
            disabled={isLoading}
            value={field.value ?? SECONDARY_NONE}
            onChange={(event) => {
              const next = event.target.value;

              if (next === SECONDARY_NONE) {
                field.onChange(null);

                return;
              }

              if (isMovementType(next)) {
                field.onChange(next);
              }
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

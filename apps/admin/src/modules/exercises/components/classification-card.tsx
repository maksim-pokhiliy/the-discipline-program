"use client";

import {
  Autocomplete,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { type CreateExerciseData } from "@repo/contracts/lms/exercise";

import { FormCard } from "@app/lib/components/form-card";
import { useMovementFamilies } from "@app/lib/hooks";

import { NATURE_LABELS } from "../constants";

type ClassificationCardProps = {
  isLoading: boolean;
};

export const ClassificationCard = ({ isLoading }: ClassificationCardProps) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<CreateExerciseData>();

  const { data: movementFamilies } = useMovementFamilies();

  return (
    <FormCard title="Classification">
      <Stack spacing={3}>
        <FormControl fullWidth size="small" error={!!errors.nature}>
          <InputLabel>Nature</InputLabel>

          <Controller
            name="nature"
            control={control}
            render={({ field }) => (
              <Select {...field} label="Nature" disabled={isLoading}>
                {Object.entries(NATURE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            )}
          />

          {errors.nature && <FormHelperText>{errors.nature.message}</FormHelperText>}
        </FormControl>

        <Controller
          name="movementFamily"
          control={control}
          render={({ field, fieldState }) => (
            <Autocomplete
              freeSolo
              options={movementFamilies ?? []}
              value={field.value ?? null}
              onChange={(_, next) => field.onChange(next ?? null)}
              onInputChange={(_, next) => field.onChange(next === "" ? null : next)}
              disabled={isLoading}
              renderInput={(params) => {
                const {
                  size: paramsSize,
                  disabled: paramsDisabled,
                  id: paramsId,
                  InputLabelProps,
                  inputProps,
                  InputProps,
                } = params;

                return (
                  <TextField
                    {...(paramsSize !== undefined && { size: paramsSize })}
                    {...(paramsDisabled !== undefined && { disabled: paramsDisabled })}
                    {...(paramsId !== undefined && { id: paramsId })}
                    inputProps={inputProps}
                    label="Movement Family"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message ?? "Soft grouping for 1RM resolution"}
                    slotProps={{
                      inputLabel: InputLabelProps,
                      input: InputProps,
                    }}
                  />
                );
              }}
            />
          )}
        />
      </Stack>
    </FormCard>
  );
};

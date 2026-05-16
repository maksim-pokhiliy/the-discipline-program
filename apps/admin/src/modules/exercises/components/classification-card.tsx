"use client";

import {
  Autocomplete,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { type CreateExerciseData } from "@repo/contracts/lms/exercise";
import { FormCard } from "@repo/ui";

import { useMovementFamilies } from "@app/lib/hooks";

import { COMPOUND_TYPE_LABELS } from "../constants";

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
        <FormControl fullWidth size="small" error={!!errors.canonicalCompoundType}>
          <InputLabel>Compound Type</InputLabel>

          <Controller
            name="canonicalCompoundType"
            control={control}
            render={({ field }) => (
              <Select {...field} label="Compound Type" disabled={isLoading}>
                {Object.entries(COMPOUND_TYPE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            )}
          />

          {errors.canonicalCompoundType && (
            <FormHelperText>{errors.canonicalCompoundType.message}</FormHelperText>
          )}
        </FormControl>

        <Controller
          name="placeholderFlag"
          control={control}
          render={({ field, fieldState }) => (
            <FormControl error={!!fieldState.error} component="fieldset" variant="standard">
              <FormControlLabel
                control={
                  <Switch
                    checked={!!field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    disabled={isLoading}
                  />
                }
                label="Placeholder slot"
              />

              <FormHelperText>
                {fieldState.error?.message ?? 'Use for coach-choice slots like "biceps / triceps"'}
              </FormHelperText>
            </FormControl>
          )}
        />

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

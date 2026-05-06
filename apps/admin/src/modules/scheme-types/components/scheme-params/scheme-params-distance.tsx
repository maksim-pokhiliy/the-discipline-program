"use client";

import {
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { DISTANCE_UNIT_OPTIONS } from "@repo/contracts/lms/_domain";

import { type SchemeTypeFormValues } from "./scheme-params.types";

type SchemeParamsDistanceFormProps = {
  basePath: "defaultParams";
  isLoading: boolean;
};

export const SchemeParamsDistanceForm = ({
  basePath,
  isLoading,
}: SchemeParamsDistanceFormProps) => {
  const { register, control, getFieldState, formState } = useFormContext<SchemeTypeFormValues>();

  const unitName = `${basePath}.unit` as const;
  const distanceMinName = `${basePath}.distanceMin` as const;
  const distanceMaxName = `${basePath}.distanceMax` as const;
  const capSecName = `${basePath}.capSec` as const;

  const distanceMinError = getFieldState(distanceMinName, formState).error;
  const distanceMaxError = getFieldState(distanceMaxName, formState).error;
  const capSecError = getFieldState(capSecName, formState).error;

  return (
    <Stack spacing={3}>
      <Controller
        name={unitName}
        control={control}
        render={({ field, fieldState }) => (
          <FormControl fullWidth size="small" error={!!fieldState.error}>
            <InputLabel id={`${basePath}-distance-unit-label`}>Unit</InputLabel>
            <Select
              labelId={`${basePath}-distance-unit-label`}
              label="Unit"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isLoading}
            >
              {DISTANCE_UNIT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {fieldState.error?.message !== undefined && (
              <FormHelperText>{fieldState.error.message}</FormHelperText>
            )}
          </FormControl>
        )}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Distance Min"
            type="number"
            variant="outlined"
            fullWidth
            size="small"
            disabled={isLoading}
            error={!!distanceMinError}
            helperText={distanceMinError?.message}
            inputProps={{ min: 0.01, step: 0.01 }}
            {...register(distanceMinName, { valueAsNumber: true })}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Distance Max (optional)"
            type="number"
            variant="outlined"
            fullWidth
            size="small"
            disabled={isLoading}
            error={!!distanceMaxError}
            helperText={distanceMaxError?.message}
            inputProps={{ min: 0.01, step: 0.01 }}
            {...register(distanceMaxName, { valueAsNumber: true })}
          />
        </Grid>
      </Grid>

      <TextField
        label="Cap (sec, optional)"
        type="number"
        variant="outlined"
        fullWidth
        size="small"
        disabled={isLoading}
        error={!!capSecError}
        helperText={capSecError?.message}
        inputProps={{ min: 1, step: 1 }}
        {...register(capSecName, { valueAsNumber: true })}
      />
    </Stack>
  );
};

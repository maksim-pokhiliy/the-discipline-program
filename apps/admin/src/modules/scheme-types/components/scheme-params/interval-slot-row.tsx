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
import { Controller, type FieldValues, useFormContext } from "react-hook-form";

import { DynamicListItem } from "@repo/ui";

import { type SchemeParamsBasePath } from "./scheme-params-field";

type UntypedFormValues = FieldValues;

type IntervalSlotRowProps = {
  basePath: SchemeParamsBasePath;
  index: number;
  onRemove: () => void;
  isLoading: boolean;
  canRemove: boolean;
};

const ACTION_OPTIONS = [
  { value: "WORK", label: "Work" },
  { value: "REST", label: "Rest" },
] as const;

export const IntervalSlotRow = ({
  basePath,
  index,
  onRemove,
  isLoading,
  canRemove,
}: IntervalSlotRowProps) => {
  const { register, control, getFieldState, formState } = useFormContext<UntypedFormValues>();

  const durationName = `${basePath}.slots.${index}.durationSec`;
  const actionName = `${basePath}.slots.${index}.action`;
  const labelName = `${basePath}.slots.${index}.label`;
  const entryRefIndexName = `${basePath}.slots.${index}.entryRefIndex`;

  const durationError = getFieldState(durationName, formState).error;
  const labelError = getFieldState(labelName, formState).error;
  const entryRefIndexError = getFieldState(entryRefIndexName, formState).error;

  return (
    <DynamicListItem
      onRemove={onRemove}
      disableRemove={!canRemove}
      removeAriaLabel={`Remove slot ${index + 1}`}
    >
      <Stack spacing={2}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Duration (sec)"
              type="number"
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!durationError}
              helperText={durationError?.message}
              inputProps={{ min: 1, step: 1 }}
              {...register(durationName, { valueAsNumber: true })}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name={actionName}
              control={control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth size="small" error={!!fieldState.error}>
                  <InputLabel id={`${basePath}-slot-${index}-action-label`}>Action</InputLabel>
                  <Select
                    labelId={`${basePath}-slot-${index}-action-label`}
                    label="Action"
                    value={typeof field.value === "string" ? field.value : ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={isLoading}
                  >
                    {ACTION_OPTIONS.map((option) => (
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
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Label (optional)"
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!labelError}
              helperText={labelError?.message}
              {...register(labelName)}
            />
          </Grid>
        </Grid>

        <TextField
          label="Entry Ref Index (optional)"
          type="number"
          variant="outlined"
          fullWidth
          size="small"
          disabled={isLoading}
          error={!!entryRefIndexError}
          helperText={entryRefIndexError?.message}
          inputProps={{ min: 0, step: 1 }}
          {...register(entryRefIndexName, { valueAsNumber: true })}
        />
      </Stack>
    </DynamicListItem>
  );
};

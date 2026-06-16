"use client";

import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { type z } from "zod";

import { type createExerciseSchema, type ExerciseNature } from "@repo/contracts/lms/exercise";

import { TagsInput } from "../tags-input";

export const NATURE_LABELS: Record<ExerciseNature, string> = {
  CONCRETE: "Concrete",
  PLACEHOLDER: "Placeholder",
  REST: "Rest",
};

export type ExerciseFormValues = z.infer<typeof createExerciseSchema>;

export type ExerciseFormFieldsProps = {
  isLoading?: boolean | undefined;
};

export const ExerciseFormFields = ({ isLoading = false }: ExerciseFormFieldsProps) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ExerciseFormValues>();

  return (
    <Stack spacing={3}>
      <TextField
        label="Canonical Name"
        placeholder="e.g. Back Squat"
        variant="outlined"
        fullWidth
        size="small"
        disabled={isLoading}
        error={errors.canonicalName !== undefined}
        helperText={errors.canonicalName?.message ?? "Will be uniquely matched case-insensitively"}
        {...register("canonicalName")}
      />

      <FormControl fullWidth size="small" error={errors.nature !== undefined}>
        <InputLabel>Nature</InputLabel>

        <Controller
          name="nature"
          control={control}
          render={({ field }) => (
            <Select {...field} label="Nature" disabled={isLoading}>
              {Object.entries(NATURE_LABELS).map(([value, optionLabel]) => (
                <MenuItem key={value} value={value}>
                  {optionLabel}
                </MenuItem>
              ))}
            </Select>
          )}
        />

        {errors.nature !== undefined && <FormHelperText>{errors.nature.message}</FormHelperText>}
      </FormControl>

      <Controller
        name="defaultDemoUrls"
        control={control}
        render={({ field, fieldState }) => (
          <TagsInput
            label="Default Demo URLs"
            placeholder="https://..."
            value={field.value}
            onChange={field.onChange}
            disabled={isLoading}
            error={fieldState.error !== undefined}
            helperText={
              fieldState.error?.message ?? "Press Enter to add a URL. URLs validated on submit."
            }
          />
        )}
      />

      <Controller
        name="aliases"
        control={control}
        render={({ field, fieldState }) => (
          <TagsInput
            label="Aliases"
            placeholder="alternative name"
            value={field.value}
            onChange={field.onChange}
            disabled={isLoading}
            error={fieldState.error !== undefined}
            helperText={fieldState.error?.message ?? "Press Enter to add an alias."}
          />
        )}
      />

      <TextField
        label="Notes"
        placeholder="Coaching cues, contraindications, scaling notes..."
        multiline
        rows={4}
        variant="outlined"
        fullWidth
        size="small"
        disabled={isLoading}
        error={errors.notes !== undefined}
        helperText={errors.notes?.message}
        {...register("notes")}
      />
    </Stack>
  );
};

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
import { type z } from "zod";

import { MOVEMENT_PATTERN_OPTIONS, PR_KIND_OPTIONS } from "@repo/contracts/lms/_domain";
import { type createExerciseSchema } from "@repo/contracts/lms/exercise";
import { FormCard, TagsInput } from "@repo/ui";

type ExerciseFormValues = z.input<typeof createExerciseSchema>;

type ExerciseFormProps = {
  isLoading?: boolean;
};

export const ExerciseForm = ({ isLoading = false }: ExerciseFormProps) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ExerciseFormValues>();

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Stack spacing={3}>
          <FormCard title="Identity">
            <TextField
              label="Name"
              placeholder="e.g. Back Squat"
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!errors.name}
              helperText={errors.name?.message}
              {...register("name")}
            />
          </FormCard>

          <FormCard title="Videos">
            <Controller
              name="urls"
              control={control}
              render={({ field, fieldState }) => (
                <TagsInput
                  label="Video URLs"
                  placeholder="Paste URL and press Enter"
                  value={field.value}
                  onChange={field.onChange}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message ?? "Press Enter to add a video link"}
                  disabled={isLoading}
                  size="small"
                />
              )}
            />
          </FormCard>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={3}>
          <FormCard title="Classification">
            <Stack spacing={3}>
              <Controller
                name="primaryMovement"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth size="small" error={!!fieldState.error}>
                    <InputLabel id="exercise-primary-movement-label">Primary Movement</InputLabel>
                    <Select
                      labelId="exercise-primary-movement-label"
                      label="Primary Movement"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={isLoading}
                    >
                      {MOVEMENT_PATTERN_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {fieldState.error && (
                      <FormHelperText>{fieldState.error.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              <Controller
                name="benchmarkPrKind"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth size="small" error={!!fieldState.error}>
                    <InputLabel id="exercise-benchmark-pr-kind-label">Benchmark PR Kind</InputLabel>
                    <Select<string>
                      labelId="exercise-benchmark-pr-kind-label"
                      label="Benchmark PR Kind"
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const next = event.target.value;

                        field.onChange(next === "" ? undefined : next);
                      }}
                      onBlur={field.onBlur}
                      disabled={isLoading}
                    >
                      <MenuItem value="">(none)</MenuItem>
                      {PR_KIND_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {fieldState.error && (
                      <FormHelperText>{fieldState.error.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Stack>
          </FormCard>
        </Stack>
      </Grid>
    </Grid>
  );
};

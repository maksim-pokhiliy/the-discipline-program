"use client";

import { Grid, Stack, Switch, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import type { CreateExerciseData, UpdateExerciseData } from "@repo/contracts/library/exercise";
import { MeasurementUnit } from "@repo/contracts/library/exercise";
import { FormCard, MultiSelect, TagsInput } from "@repo/ui";

import { MEASUREMENT_UNIT_OPTIONS } from "../constants";

type ExerciseFormProps = {
  isLoading?: boolean;
};

type ExerciseFormValues = CreateExerciseData & UpdateExerciseData;

const MEASUREMENT_UNIT_OPTION_OBJECTS = MEASUREMENT_UNIT_OPTIONS.map((opt) => ({
  id: opt.value,
  label: opt.label,
}));

const emptyToUndefined = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed === "" ? undefined : trimmed;
};

export const ExerciseForm = ({ isLoading = false }: ExerciseFormProps) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ExerciseFormValues>();

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Stack spacing={3}>
          <FormCard title="Identity">
            <Stack spacing={3}>
              <TextField
                label="Canonical name"
                placeholder="e.g. Back Squat"
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.canonicalName}
                helperText={errors.canonicalName?.message}
                {...register("canonicalName")}
              />

              <Controller
                name="aliases"
                control={control}
                render={({ field }) => (
                  <TagsInput
                    value={field.value ?? []}
                    onChange={field.onChange}
                    label="Aliases"
                    placeholder="Type an alias and press Enter"
                    disabled={isLoading}
                    error={!!errors.aliases}
                    helperText={errors.aliases?.message || "Press Enter to add an alias"}
                    size="medium"
                  />
                )}
              />

              <TextField
                label="Description"
                placeholder="Brief coaching notes, cues, form tips"
                variant="outlined"
                multiline
                minRows={3}
                fullWidth
                disabled={isLoading}
                error={!!errors.description}
                helperText={errors.description?.message}
                {...register("description", { setValueAs: emptyToUndefined })}
              />

              <TextField
                label="Video URL"
                placeholder="https://..."
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.videoUrl}
                helperText={errors.videoUrl?.message}
                {...register("videoUrl", { setValueAs: emptyToUndefined })}
              />
            </Stack>
          </FormCard>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={3}>
          <FormCard title="Measurement">
            <Stack spacing={3}>
              <Controller
                name="measurementUnits"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={MEASUREMENT_UNIT_OPTION_OBJECTS}
                    value={field.value ?? []}
                    onChange={(next) => field.onChange(next as MeasurementUnit[])}
                    getOptionId={(opt) => opt.id}
                    getOptionLabel={(opt) => opt.label}
                    label="Measurement units"
                    placeholder="Pick units"
                    disabled={isLoading}
                    errorText={errors.measurementUnits?.message}
                    disableSelectAll
                  />
                )}
              />

              <Controller
                name="hasLoad"
                control={control}
                render={({ field }) => (
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Stack>
                      <Typography variant="subtitle2">Has load</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Exercise uses external weight
                      </Typography>
                    </Stack>
                    <Switch
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                      disabled={isLoading}
                    />
                  </Stack>
                )}
              />
            </Stack>
          </FormCard>
        </Stack>
      </Grid>
    </Grid>
  );
};

export const createExerciseFormDefaults = (): CreateExerciseData => ({
  canonicalName: "",
  aliases: [],
  description: undefined,
  videoUrl: undefined,
  measurementUnits: [MeasurementUnit.REPS],
  hasLoad: false,
});

type ExerciseLike = {
  canonicalName: string;
  aliases: string[];
  description: string | null;
  videoUrl: string | null;
  measurementUnits: MeasurementUnit[];
  hasLoad: boolean;
};

export const exerciseToFormDefaults = (exercise: ExerciseLike): UpdateExerciseData => ({
  canonicalName: exercise.canonicalName,
  aliases: exercise.aliases,
  description: exercise.description ?? undefined,
  videoUrl: exercise.videoUrl ?? undefined,
  measurementUnits: exercise.measurementUnits,
  hasLoad: exercise.hasLoad,
});

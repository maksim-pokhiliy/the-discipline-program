"use client";

import { Grid, Stack, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { type CreateExerciseData } from "@repo/contracts/exercise";
import { type ExerciseCategory } from "@repo/contracts/exercise-category";
import { CreatableAutocomplete, FormCard } from "@repo/ui";

interface ExerciseFormProps {
  categories: ExerciseCategory[];
  onCreateCategory: (name: string) => Promise<ExerciseCategory>;
  isLoading?: boolean;
}

export const ExerciseForm = ({
  categories,
  onCreateCategory,
  isLoading = false,
}: ExerciseFormProps) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CreateExerciseData>();

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Stack spacing={3}>
          <FormCard title="Exercise Details">
            <Stack spacing={3}>
              <TextField
                label="Exercise Name"
                placeholder="e.g. Back Squat"
                size="small"
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register("name")}
              />

              <TextField
                label="Description"
                placeholder="Movement description, coaching cues, scaling options..."
                multiline
                minRows={6}
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.description}
                helperText={errors.description?.message}
                {...register("description")}
              />
            </Stack>
          </FormCard>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={3}>
          <FormCard title="Classification">
            <Controller
              name="categoryId"
              control={control}
              render={({ field, fieldState }) => (
                <CreatableAutocomplete
                  options={categories}
                  value={categories.find((c) => c.id === field.value) ?? null}
                  onChange={(category) => field.onChange(category?.id ?? "")}
                  onCreate={onCreateCategory}
                  getOptionLabel={(c) => c.name}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  label="Category"
                  placeholder="Select or create category"
                  disabled={isLoading}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </FormCard>

          <FormCard title="Media">
            <TextField
              label="Video URL"
              placeholder="https://youtube.com/watch?v=..."
              size="small"
              variant="outlined"
              fullWidth
              disabled={isLoading}
              error={!!errors.videoUrl}
              helperText={errors.videoUrl?.message || "Link to demonstration video"}
              {...register("videoUrl")}
            />
          </FormCard>
        </Stack>
      </Grid>
    </Grid>
  );
};

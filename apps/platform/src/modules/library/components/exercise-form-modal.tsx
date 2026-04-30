"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox, FormControlLabel, MenuItem, Stack, Switch, TextField } from "@mui/material";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { type z } from "zod";

import {
  type CreateExerciseLibraryItemInput,
  createExerciseLibraryItemInputSchema,
  EXERCISE_LIBRARY_ITEM_CONSTANTS,
  type ExerciseLibraryItem,
  type UpdateExerciseLibraryItemInput,
} from "@repo/contracts/lms/exercise-library-item";
import { FormModal, MultiSelect, TagsInput } from "@repo/ui";

import { useCreateExercise, useUpdateExercise } from "@app/lib/hooks";

import {
  BODY_PART_OPTIONS,
  MODALITY_OPTIONS,
  MOVEMENT_PATTERN_OPTIONS,
  SKILL_LEVEL_OPTIONS,
} from "../constants";

type ExerciseFormInput = z.input<typeof createExerciseLibraryItemInputSchema>;

const METRIC_FIELDS = [
  { name: "canMeasureLoad", label: "Load" },
  { name: "canMeasureReps", label: "Reps" },
  { name: "canMeasureDuration", label: "Duration" },
  { name: "canMeasureDistance", label: "Distance" },
  { name: "canMeasureCalories", label: "Calories" },
] as const;

const buildDefaults = (initial?: ExerciseLibraryItem): ExerciseFormInput => ({
  scope: "COACH",
  name: initial?.name ?? "",
  nameAliases: initial?.nameAliases ?? [],
  description: initial?.description ?? undefined,
  primaryMovement: initial?.primaryMovement ?? "SQUAT",
  modality: initial?.modality ?? "BARBELL",
  equipment: initial?.equipment ?? [],
  primaryBodyParts: initial?.primaryBodyParts ?? [],
  secondaryBodyParts: initial?.secondaryBodyParts ?? [],
  skillLevel: initial?.skillLevel ?? "BEGINNER",
  defaultMetrics: initial?.defaultMetrics ?? {
    canMeasureLoad: false,
    canMeasureReps: false,
    canMeasureDuration: false,
    canMeasureDistance: false,
    canMeasureCalories: false,
  },
  demoVideoUrl: initial?.demoVideoUrl ?? undefined,
  demoImageUrl: initial?.demoImageUrl ?? undefined,
  parentId: initial?.parentId ?? undefined,
  isBenchmark: initial?.isBenchmark ?? false,
});

type ExerciseFormModalProps = {
  open: boolean;
  initial?: ExerciseLibraryItem;
  onClose: () => void;
};

export const ExerciseFormModal = ({ open, initial, onClose }: ExerciseFormModalProps) => {
  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();
  const isEdit = !!initial;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const methods = useForm<ExerciseFormInput, unknown, CreateExerciseLibraryItemInput>({
    resolver: zodResolver(createExerciseLibraryItemInputSchema),
    defaultValues: buildDefaults(initial),
  });

  useEffect(() => {
    if (open) {
      methods.reset(buildDefaults(initial));
    }
  }, [open, initial, methods]);

  const submit = methods.handleSubmit((data) => {
    if (isEdit && initial) {
      const payload: UpdateExerciseLibraryItemInput = {
        name: data.name,
        nameAliases: data.nameAliases,
        description: data.description,
        primaryMovement: data.primaryMovement,
        modality: data.modality,
        equipment: data.equipment,
        primaryBodyParts: data.primaryBodyParts,
        secondaryBodyParts: data.secondaryBodyParts,
        skillLevel: data.skillLevel,
        defaultMetrics: data.defaultMetrics,
        demoVideoUrl: data.demoVideoUrl,
        demoImageUrl: data.demoImageUrl,
        parentId: data.parentId,
        isBenchmark: data.isBenchmark,
      };

      updateMutation.mutate({ id: initial.id, data: payload }, { onSuccess: () => onClose() });

      return;
    }

    createMutation.mutate(data, { onSuccess: () => onClose() });
  });

  const {
    control,
    register,
    formState: { errors },
  } = methods;

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={submit}
      isSubmitting={isPending}
      title={isEdit ? "Edit exercise" : "Create exercise"}
      submitText={isEdit ? "Save" : "Create"}
      maxWidth="md"
    >
      <FormProvider {...methods}>
        <Stack spacing={2.5}>
          <TextField
            label="Name"
            placeholder="e.g. Strict Pull-up"
            variant="outlined"
            fullWidth
            disabled={isPending}
            error={!!errors.name}
            helperText={errors.name?.message}
            inputProps={{ maxLength: EXERCISE_LIBRARY_ITEM_CONSTANTS.MAX_NAME_LENGTH }}
            {...register("name")}
          />

          <Controller
            name="nameAliases"
            control={control}
            render={({ field, fieldState }) => (
              <TagsInput
                label="Aliases"
                placeholder="Synonyms users may search by"
                value={field.value ?? []}
                onChange={field.onChange}
                disabled={isPending}
                error={!!fieldState.error}
                helperText={fieldState.error?.message ?? "Press Enter after each alias"}
                size="medium"
              />
            )}
          />

          <Controller
            name="primaryMovement"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Primary movement"
                select
                variant="outlined"
                fullWidth
                disabled={isPending}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                {MOVEMENT_PATTERN_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="modality"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Modality"
                select
                variant="outlined"
                fullWidth
                disabled={isPending}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                {MODALITY_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="skillLevel"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Skill level"
                select
                variant="outlined"
                fullWidth
                disabled={isPending}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                {SKILL_LEVEL_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="primaryBodyParts"
            control={control}
            render={({ field, fieldState }) => (
              <MultiSelect
                options={BODY_PART_OPTIONS}
                value={field.value ?? []}
                onChange={field.onChange}
                getOptionId={(opt) => opt.value}
                getOptionLabel={(opt) => opt.label}
                label="Primary body parts"
                placeholder="Select primary body parts"
                disabled={isPending}
                errorText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="secondaryBodyParts"
            control={control}
            render={({ field, fieldState }) => (
              <MultiSelect
                options={BODY_PART_OPTIONS}
                value={field.value ?? []}
                onChange={field.onChange}
                getOptionId={(opt) => opt.value}
                getOptionLabel={(opt) => opt.label}
                label="Secondary body parts"
                placeholder="Select secondary body parts"
                disabled={isPending}
                errorText={fieldState.error?.message}
              />
            )}
          />

          <Stack>
            {METRIC_FIELDS.map((m) => (
              <Controller
                key={m.name}
                name={`defaultMetrics.${m.name}`}
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value ?? false}
                        onChange={(e) => field.onChange(e.target.checked)}
                        disabled={isPending}
                        size="small"
                      />
                    }
                    label={`Default metric: ${m.label}`}
                  />
                )}
              />
            ))}
          </Stack>

          <Controller
            name="isBenchmark"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value ?? false}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={isPending}
                  />
                }
                label="Benchmark"
              />
            )}
          />
        </Stack>
      </FormProvider>
    </FormModal>
  );
};

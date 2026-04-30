"use client";

import { MenuItem, Stack, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import {
  type CreateExerciseLibraryItemInput,
  type UpdateExerciseLibraryItemInput,
} from "@repo/contracts/lms/exercise-library-item";
import { FormCard, MultiSelect, TagsInput } from "@repo/ui";

import {
  BODY_PART_OPTIONS,
  MODALITY_OPTIONS,
  MOVEMENT_PATTERN_OPTIONS,
  SKILL_LEVEL_OPTIONS,
} from "../../constants";

type FormValues = CreateExerciseLibraryItemInput & UpdateExerciseLibraryItemInput;

type TaxonomyCardProps = {
  isLoading: boolean;
};

export const TaxonomyCard = ({ isLoading }: TaxonomyCardProps) => {
  const { control } = useFormContext<FormValues>();

  return (
    <FormCard title="Taxonomy">
      <Stack spacing={3}>
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
              errorText={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="equipment"
          control={control}
          render={({ field, fieldState }) => (
            <TagsInput
              label="Equipment"
              placeholder="Add equipment tags"
              value={field.value ?? []}
              onChange={field.onChange}
              disabled={isLoading}
              error={!!fieldState.error}
              helperText={fieldState.error?.message ?? "Press Enter after each tag"}
              size="medium"
            />
          )}
        />
      </Stack>
    </FormCard>
  );
};

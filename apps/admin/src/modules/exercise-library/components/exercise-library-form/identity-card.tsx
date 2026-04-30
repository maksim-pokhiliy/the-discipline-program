"use client";

import { Stack, TextField } from "@mui/material";
import dynamic from "next/dynamic";
import { Controller, useFormContext } from "react-hook-form";

import {
  EXERCISE_LIBRARY_ITEM_CONSTANTS,
  type CreateExerciseLibraryItemInput,
  type UpdateExerciseLibraryItemInput,
} from "@repo/contracts/lms/exercise-library-item";
import { FormCard, TagsInput } from "@repo/ui";

const MarkdownEditor = dynamic(
  () => import("@repo/ui").then((m) => ({ default: m.MarkdownEditor })),
  { ssr: false },
);

type FormValues = CreateExerciseLibraryItemInput & UpdateExerciseLibraryItemInput;

type IdentityCardProps = {
  isLoading: boolean;
};

export const IdentityCard = ({ isLoading }: IdentityCardProps) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<FormValues>();

  return (
    <FormCard title="Identity">
      <Stack spacing={3}>
        <TextField
          label="Name"
          placeholder="e.g. Strict Pull-up"
          variant="outlined"
          fullWidth
          disabled={isLoading}
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
              disabled={isLoading}
              error={!!fieldState.error}
              helperText={fieldState.error?.message ?? "Press Enter after each alias"}
              size="medium"
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <MarkdownEditor
              label="Description"
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="Coaching cues, setup notes, scaling..."
              disabled={isLoading}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              minRows={6}
            />
          )}
        />
      </Stack>
    </FormCard>
  );
};

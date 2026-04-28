"use client";

import { Stack, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import {
  type CreateExerciseLibraryItemInput,
  type UpdateExerciseLibraryItemInput,
} from "@repo/contracts/lms/exercise-library-item";
import { FormCard } from "@repo/ui";

type FormValues = CreateExerciseLibraryItemInput & UpdateExerciseLibraryItemInput;

type MediaCardProps = {
  isLoading: boolean;
};

export const MediaCard = ({ isLoading }: MediaCardProps) => {
  const { control, trigger } = useFormContext<FormValues>();

  return (
    <FormCard title="Media">
      <Stack spacing={2}>
        <Controller
          name="demoVideoUrl"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              label="Demo video URL"
              placeholder="https://..."
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value || undefined)}
              onBlur={() => {
                field.onBlur();
                void trigger("demoVideoUrl");
              }}
              inputRef={field.ref}
            />
          )}
        />

        <Controller
          name="demoImageUrl"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              label="Demo image URL"
              placeholder="https://..."
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value || undefined)}
              onBlur={() => {
                field.onBlur();
                void trigger("demoImageUrl");
              }}
              inputRef={field.ref}
            />
          )}
        />
      </Stack>
    </FormCard>
  );
};

"use client";

import { Stack, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import {
  type CreateExerciseLibraryItemInput,
  type UpdateExerciseLibraryItemInput,
} from "@repo/contracts/lms/exercise-library-item";
import { UPLOAD_CONFIG } from "@repo/contracts/storage/upload";
import { FormCard, ImageUpload } from "@repo/ui";

import { useDeleteImage, useUploadImage } from "@app/lib/hooks";

type FormValues = CreateExerciseLibraryItemInput & UpdateExerciseLibraryItemInput;

type MediaCardProps = {
  isLoading: boolean;
};

export const MediaCard = ({ isLoading }: MediaCardProps) => {
  const { control, trigger } = useFormContext<FormValues>();
  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();
  const { mutate: deleteImage } = useDeleteImage();

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
              helperText={fieldState.error?.message ?? "YouTube or direct link"}
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
          render={({ field }) => (
            <ImageUpload
              label="Demo image"
              previewUrl={field.value ?? ""}
              isUploading={isUploading}
              disabled={isLoading}
              maxSizeBytes={UPLOAD_CONFIG.exercise.maxSize}
              acceptedTypes={[...UPLOAD_CONFIG.exercise.acceptedTypes]}
              onFileSelect={(file) => {
                uploadImage(
                  { file, context: "exercise" },
                  {
                    onSuccess: (res) => field.onChange(res.url),
                  },
                );
              }}
              onRemove={() => {
                const previousUrl = field.value;

                field.onChange(undefined);

                if (previousUrl) {
                  deleteImage(previousUrl);
                }
              }}
            />
          )}
        />
      </Stack>
    </FormCard>
  );
};

"use client";

import { Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { FormCard, ImageUpload } from "@repo/ui";

import { useUploadImage } from "@app/lib/hooks";

export const HeroSectionForm = () => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();

  return (
    <FormCard title="Hero Section Settings">
      <Stack spacing={3}>
        <TextField
          label="Title"
          fullWidth
          error={!!errors.title}
          helperText={errors.title?.message as string}
          {...register("title")}
        />

        <TextField
          label="Subtitle"
          fullWidth
          multiline
          minRows={3}
          error={!!errors.subtitle}
          helperText={errors.subtitle?.message as string}
          {...register("subtitle")}
        />

        <Stack spacing={1}>
          <ImageUpload
            previewUrl={watch("backgroundImage") || ""}
            isUploading={isUploading}
            onFileSelect={(file) => {
              uploadImage(
                { file, context: "marketing" },
                {
                  onSuccess: (res) => setValue("backgroundImage", res.url, { shouldDirty: true }),
                },
              );
            }}
            onRemove={() => setValue("backgroundImage", "", { shouldDirty: true })}
          />
        </Stack>
      </Stack>
    </FormCard>
  );
};

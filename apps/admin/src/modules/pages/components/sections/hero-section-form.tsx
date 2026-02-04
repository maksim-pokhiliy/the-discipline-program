"use client";

import { Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { FormCard, ImageUpload } from "@repo/ui";

import { useUploadImage } from "@app/lib/hooks";

interface HeroSectionFormProps {
  sectionType: string;
}

const SECTIONS_WITH_BUTTON = ["hero"];
const SECTIONS_WITH_BACKGROUND = ["hero", "about:hero", "contact:hero", "blog:hero"];

export const HeroSectionForm = ({ sectionType }: HeroSectionFormProps) => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();

  const showButton = SECTIONS_WITH_BUTTON.includes(sectionType);
  const showBackground = SECTIONS_WITH_BACKGROUND.includes(sectionType);

  return (
    <FormCard title="Hero Section Settings">
      <Stack spacing={3}>
        <TextField
          label="Title"
          fullWidth
          error={!!errors.title}
          helperText={errors.title?.message?.toString()}
          {...register("title")}
        />

        <TextField
          label="Subtitle"
          fullWidth
          multiline
          minRows={3}
          error={!!errors.subtitle}
          helperText={errors.subtitle?.message?.toString()}
          {...register("subtitle")}
        />

        {showButton && (
          <>
            <TextField
              label="Button Text"
              fullWidth
              error={!!errors.buttonText}
              helperText={errors.buttonText?.message?.toString()}
              {...register("buttonText")}
            />

            <TextField
              label="Button Link"
              fullWidth
              error={!!errors.buttonHref}
              helperText={errors.buttonHref?.message?.toString()}
              {...register("buttonHref")}
            />
          </>
        )}

        {showBackground && (
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
        )}
      </Stack>
    </FormCard>
  );
};

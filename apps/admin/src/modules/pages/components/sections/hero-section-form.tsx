"use client";

import { Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { type z } from "zod";

import { type homePageHeroSchema } from "@repo/contracts/pages";
import { FormCard, ImageUpload } from "@repo/ui";

import { useUploadImage } from "@app/lib/hooks";

import { SECTION_FEATURES, type HeroSectionType } from "../../config/section-features";

type HeroSectionData = z.infer<typeof homePageHeroSchema>;

type HeroSectionFormProps = {
  sectionType: HeroSectionType;
};

export const HeroSectionForm = ({ sectionType }: HeroSectionFormProps) => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<HeroSectionData>();
  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();

  const features = SECTION_FEATURES[sectionType];

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

        {features.hasButton && (
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

        {features.hasBackground && (
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

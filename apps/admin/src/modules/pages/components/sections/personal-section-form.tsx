"use client";

import { Grid, Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { type z } from "zod";

import { type aboutPagePersonalSchema } from "@repo/contracts/cms/pages";
import { ImageUpload } from "@repo/ui";

import { FormCard } from "@app/lib/components/form-card";
import { useDeleteImage, useUploadImage } from "@app/lib/hooks";

type PersonalSectionData = z.infer<typeof aboutPagePersonalSchema>;

export const PersonalSectionForm = () => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<PersonalSectionData>();
  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();
  const deleteImage = useDeleteImage();

  return (
    <FormCard title="Personal Section Settings">
      <Stack spacing={3}>
        <TextField
          label="Section Title"
          fullWidth
          error={!!errors.title}
          helperText={errors.title?.message}
          {...register("title")}
        />

        <TextField
          label="Description"
          fullWidth
          multiline
          minRows={3}
          error={!!errors.description}
          helperText={errors.description?.message}
          {...register("description")}
        />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Name"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
              {...register("name")}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Role"
              fullWidth
              error={!!errors.role}
              helperText={errors.role?.message}
              {...register("role")}
            />
          </Grid>
        </Grid>

        <ImageUpload
          previewUrl={watch("image") || ""}
          isUploading={isUploading}
          onFileSelect={(file) => {
            uploadImage(
              { file, context: "marketing" },
              {
                onSuccess: (res) => setValue("image", res.url, { shouldDirty: true }),
              },
            );
          }}
          onRemove={() => {
            const currentUrl = watch("image");

            if (currentUrl) {
              deleteImage.mutate(currentUrl);
            }

            setValue("image", "", { shouldDirty: true });
          }}
        />
      </Stack>
    </FormCard>
  );
};

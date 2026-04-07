"use client";

import { Grid, Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { type z } from "zod";

import { type aboutPagePersonalSchema } from "@repo/contracts/pages";
import { FormCard, ImageUpload } from "@repo/ui";

import { useUploadImage } from "@app/lib/hooks";

type PersonalSectionData = z.infer<typeof aboutPagePersonalSchema>;

export const PersonalSectionForm = () => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<PersonalSectionData>();
  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();

  return (
    <FormCard title="Personal Section Settings">
      <Stack spacing={3}>
        <TextField
          label="Section Title"
          fullWidth
          error={!!errors.title}
          helperText={errors.title?.message?.toString()}
          {...register("title")}
        />

        <TextField
          label="Description"
          fullWidth
          multiline
          minRows={3}
          error={!!errors.description}
          helperText={errors.description?.message?.toString()}
          {...register("description")}
        />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Name"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message?.toString()}
              {...register("name")}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Role"
              fullWidth
              error={!!errors.role}
              helperText={errors.role?.message?.toString()}
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
          onRemove={() => setValue("image", "", { shouldDirty: true })}
        />
      </Stack>
    </FormCard>
  );
};

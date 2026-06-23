"use client";

import {
  Checkbox,
  FormControlLabel,
  Grid,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { type CreateReviewData } from "@repo/contracts/cms/review";
import { UPLOAD_CONFIG } from "@repo/contracts/storage/upload";
import { ImageUpload } from "@repo/ui";

import { FormCard } from "@app/lib/components/form-card";
import { useDeleteImage, useUploadImage } from "@app/lib/hooks";

type ReviewFormProps = {
  isLoading?: boolean;
};

export const ReviewForm = ({ isLoading = false }: ReviewFormProps) => {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CreateReviewData>();

  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();
  const deleteImage = useDeleteImage();

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Stack spacing={3}>
          <FormCard title="Review Content">
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Typography component="legend" variant="subtitle2">
                  Rating
                </Typography>

                <Controller
                  name="rating"
                  control={control}
                  render={({ field }) => (
                    <Rating
                      name="rating"
                      value={Number(field.value)}
                      onChange={(_, newValue) => {
                        field.onChange(newValue);
                      }}
                      disabled={isLoading}
                    />
                  )}
                />

                {errors.rating && (
                  <Typography variant="caption" color="error">
                    {errors.rating.message}
                  </Typography>
                )}
              </Stack>

              <TextField
                label="Review Text"
                placeholder="What did the user say?"
                multiline
                minRows={4}
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.text}
                helperText={errors.text?.message}
                {...register("text")}
              />
            </Stack>
          </FormCard>

          <FormCard title="Author Details">
            <Stack spacing={3}>
              <TextField
                label="Author Name"
                placeholder="e.g. John Doe"
                size="small"
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.authorName}
                helperText={errors.authorName?.message}
                {...register("authorName")}
              />

              <TextField
                label="Author Role"
                placeholder="e.g. CrossFit Athlete / CEO"
                size="small"
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.authorRole}
                helperText={errors.authorRole?.message}
                {...register("authorRole")}
              />
            </Stack>
          </FormCard>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={3}>
          <FormCard title="Visibility">
            <FormControlLabel
              control={
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={isLoading}
                    />
                  )}
                />
              }
              label="Active (Visible)"
            />
          </FormCard>

          <FormCard title="Author Avatar">
            <Stack spacing={2}>
              <ImageUpload
                previewUrl={watch("authorAvatar") || ""}
                isUploading={isUploading}
                disabled={isLoading}
                maxSizeBytes={UPLOAD_CONFIG.avatar.maxSize}
                acceptedTypes={[...UPLOAD_CONFIG.avatar.acceptedTypes]}
                onFileSelect={(file) => {
                  uploadImage(
                    { file, context: "avatar" },
                    {
                      onSuccess: (res) => setValue("authorAvatar", res.url, { shouldDirty: true }),
                    },
                  );
                }}
                onRemove={() => {
                  const currentUrl = watch("authorAvatar");

                  if (currentUrl) {
                    deleteImage.mutate(currentUrl);
                  }

                  setValue("authorAvatar", null, { shouldDirty: true });
                }}
              />

              <Typography variant="caption" color="text.secondary">
                Upload a square image for best results.
              </Typography>
            </Stack>
          </FormCard>
        </Stack>
      </Grid>
    </Grid>
  );
};

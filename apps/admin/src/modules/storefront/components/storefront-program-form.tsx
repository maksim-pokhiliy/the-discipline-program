"use client";

import { useEffect } from "react";

import { Checkbox, FormControlLabel, Grid, Stack, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { type CreateStorefrontProgramData } from "@repo/contracts/storefront";
import { slugify } from "@repo/shared";
import { FormCard, TagsInput } from "@repo/ui";

interface StorefrontProgramFormProps {
  isLoading?: boolean;
  disableAutoSlug?: boolean;
}

export const StorefrontProgramForm = ({
  isLoading = false,
  disableAutoSlug = false,
}: StorefrontProgramFormProps) => {
  const {
    register,
    watch,
    setValue,
    control,
    formState: { errors, dirtyFields },
  } = useFormContext<CreateStorefrontProgramData>();

  const title = watch("title");

  useEffect(() => {
    if (!disableAutoSlug && title && !dirtyFields.slug) {
      setValue("slug", slugify(title), { shouldValidate: true });
    }
  }, [title, dirtyFields.slug, setValue, disableAutoSlug]);

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Stack spacing={3}>
          <FormCard title="Product Details">
            <Stack spacing={3}>
              <TextField
                label="Product Title"
                placeholder="e.g. Strength Mastery 1.0"
                size="small"
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.title}
                helperText={errors.title?.message}
                {...register("title")}
              />

              <TextField
                label="Description"
                placeholder="Describe what athletes will get..."
                multiline
                minRows={6}
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.description}
                helperText={errors.description?.message}
                {...register("description")}
              />
            </Stack>
          </FormCard>

          <FormCard title="Features List">
            <Stack spacing={1}>
              <Controller
                name="features"
                control={control}
                render={({ field, fieldState }) => (
                  <TagsInput
                    label="Key Features"
                    placeholder="Type feature and press Enter (e.g. '5 days/week')"
                    value={field.value || []}
                    onChange={field.onChange}
                    error={!!fieldState.error}
                    helperText={
                      fieldState.error?.message || "Add bullet points for the marketing card"
                    }
                    disabled={isLoading}
                  />
                )}
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
              label="Active (Visible in Store)"
            />
          </FormCard>

          <FormCard title="Pricing Display">
            <TextField
              label="Price Label"
              placeholder="e.g. $49 / month"
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!errors.priceLabel}
              helperText={errors.priceLabel?.message || "Text to display on the price button"}
              {...register("priceLabel")}
            />
          </FormCard>

          <FormCard title="URL Settings">
            <Controller
              name="slug"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="URL Slug"
                  variant="outlined"
                  fullWidth
                  size="small"
                  disabled={isLoading}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Unique identifier for the link"}
                />
              )}
            />
          </FormCard>
        </Stack>
      </Grid>
    </Grid>
  );
};

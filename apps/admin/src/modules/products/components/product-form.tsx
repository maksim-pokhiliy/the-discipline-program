"use client";

import { Checkbox, FormControlLabel, Grid, Stack, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { FormCard } from "@app/lib/components/form-card";
import { fieldsetStyles } from "@app/lib/components/localized-editor/fieldset-styles";
import { useAutoSlug } from "@app/lib/hooks";

import { ProductFeaturesCard } from "./product-features-card";
import { type ProductFormData } from "./product-form-schema";
import { ProductPhotoCard } from "./product-photo-card";
import { ProductPricingCard } from "./product-pricing-card";

type ProductFormProps = {
  isLoading?: boolean;
  disableAutoSlug?: boolean;
};

export const ProductForm = ({ isLoading = false, disableAutoSlug = false }: ProductFormProps) => {
  const form = useFormContext<ProductFormData>();
  const {
    register,
    control,
    formState: { errors },
  } = form;

  useAutoSlug({ disabled: disableAutoSlug, form });

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Stack spacing={3}>
          <FormCard title="Product Details">
            <Stack spacing={3}>
              <TextField
                label="Product Title"
                placeholder="e.g. Strength Mastery 1.0"
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

          <Stack component="fieldset" disabled={isLoading} sx={fieldsetStyles}>
            <ProductFeaturesCard />
          </Stack>
          <ProductPhotoCard isLoading={isLoading} />
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={3}>
          <FormCard title="Visibility">
            <Stack spacing={1}>
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

              <FormControlLabel
                control={
                  <Controller
                    name="isFeatured"
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
                label="Featured Product"
              />
            </Stack>
          </FormCard>

          <ProductPricingCard isLoading={isLoading} />

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

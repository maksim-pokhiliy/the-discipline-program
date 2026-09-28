"use client";

import { Checkbox, FormControlLabel, Grid, Stack, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { TagsInput } from "@repo/ui";

import { FormCard } from "@app/lib/components/form-card";
import { useAutoSlug } from "@app/lib/hooks";

import { type ProductFormData } from "./product-form-schema";
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
                    size="medium"
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

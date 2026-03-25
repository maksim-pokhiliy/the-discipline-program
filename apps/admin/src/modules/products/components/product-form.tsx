"use client";

import { useEffect } from "react";

import {
  Checkbox,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import {
  type CreateProductData,
  ProductCurrency,
  PriceInterval,
  PRICE_INTERVAL_LABELS,
} from "@repo/contracts/product";
import { amountToCents, slugify } from "@repo/shared";
import { FormCard, TagsInput } from "@repo/ui";

interface ProductFormProps {
  isLoading?: boolean;
  disableAutoSlug?: boolean;
}

export const ProductForm = ({ isLoading = false, disableAutoSlug = false }: ProductFormProps) => {
  const {
    register,
    watch,
    setValue,
    control,
    formState: { errors, dirtyFields },
  } = useFormContext<CreateProductData>();

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

          <FormCard title="Pricing">
            <Stack spacing={2}>
              <TextField
                label="Price"
                type="number"
                placeholder="0"
                variant="outlined"
                fullWidth
                size="small"
                disabled={isLoading}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                }}
                {...register("price.amountCents", {
                  setValueAs: (v: string) => (v === "" ? undefined : amountToCents(Number(v))),
                })}
              />

              <Controller
                name="price.currency"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Currency"
                    variant="outlined"
                    fullWidth
                    size="small"
                    disabled={isLoading}
                    value={field.value || "USD"}
                  >
                    {Object.values(ProductCurrency).map((currency) => (
                      <MenuItem key={currency} value={currency}>
                        {currency}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Controller
                name="price.interval"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Billing Interval"
                    variant="outlined"
                    fullWidth
                    size="small"
                    disabled={isLoading}
                    value={field.value || "MONTHLY"}
                  >
                    {Object.values(PriceInterval).map((interval) => (
                      <MenuItem key={interval} value={interval}>
                        {PRICE_INTERVAL_LABELS[interval]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Stack>
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

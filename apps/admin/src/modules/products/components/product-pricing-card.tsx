"use client";

import { InputAdornment, MenuItem, Stack, TextField } from "@mui/material";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { Currency, PERIOD_CONSTANTS, PERIOD_UNIT_LABELS, PeriodUnit } from "@repo/contracts/common";

import { FormCard } from "@app/lib/components/form-card";

import { getCurrencySymbol } from "./get-currency-symbol";
import { ProductAutoRenewField } from "./product-auto-renew-field";
import { type ProductFormData } from "./product-form-schema";

type ProductPricingCardProps = {
  isLoading: boolean;
};

export const ProductPricingCard = ({ isLoading }: ProductPricingCardProps) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProductFormData>();
  const currency = useWatch({ control, name: "price.currency" });

  return (
    <FormCard title="Pricing">
      <Stack spacing={3}>
        <TextField
          label="Price"
          type="number"
          placeholder="0"
          variant="outlined"
          fullWidth
          disabled={isLoading}
          error={!!errors.price?.amount}
          helperText={errors.price?.amount?.message}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">{getCurrencySymbol(currency)}</InputAdornment>
              ),
            },
          }}
          {...register("price.amount", {
            valueAsNumber: true,
          })}
        />

        <Controller
          name="price.currency"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              select
              label="Currency"
              variant="outlined"
              fullWidth
              disabled={isLoading}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            >
              {Object.values(Currency).map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Stack direction="row" spacing={2}>
          <TextField
            label="Period length"
            type="number"
            variant="outlined"
            fullWidth
            disabled={isLoading}
            error={!!errors.price?.periodCount}
            helperText={errors.price?.periodCount?.message}
            slotProps={{
              htmlInput: {
                min: PERIOD_CONSTANTS.MIN_COUNT,
                max: PERIOD_CONSTANTS.MAX_COUNT,
                step: 1,
              },
            }}
            {...register("price.periodCount", {
              valueAsNumber: true,
            })}
          />

          <Controller
            name="price.periodUnit"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                select
                label="Period unit"
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                {Object.values(PeriodUnit).map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {PERIOD_UNIT_LABELS[unit]}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Stack>

        <ProductAutoRenewField isLoading={isLoading} />
      </Stack>
    </FormCard>
  );
};

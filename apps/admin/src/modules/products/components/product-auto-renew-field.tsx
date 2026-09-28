"use client";

import { Checkbox, FormControl, FormControlLabel, FormHelperText } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { type ProductFormData } from "./product-form-schema";

const AUTO_RENEW_HINT = "When off, this price is sold only as a one-off paid period.";

type ProductAutoRenewFieldProps = {
  isLoading: boolean;
};

export const ProductAutoRenewField = ({ isLoading }: ProductAutoRenewFieldProps) => {
  const { control } = useFormContext<ProductFormData>();

  return (
    <Controller
      name="price.autoRenew"
      control={control}
      render={({ field, fieldState }) => (
        <FormControl error={!!fieldState.error} variant="standard">
          <FormControlLabel
            control={
              <Checkbox
                checked={field.value}
                onChange={(event) => field.onChange(event.target.checked)}
                disabled={isLoading}
              />
            }
            label="Offer auto-renew"
          />

          <FormHelperText>{fieldState.error?.message ?? AUTO_RENEW_HINT}</FormHelperText>
        </FormControl>
      )}
    />
  );
};

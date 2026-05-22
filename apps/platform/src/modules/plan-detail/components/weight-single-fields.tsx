"use client";

import { TextField } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { Weight } from "@repo/contracts/lms/_shared";

type SingleWeight = Extract<Weight, { variant: "single" }>;

type WeightSingleFieldsProps = {
  value: SingleWeight;
  onChange: (next: SingleWeight) => void;
  error?: FieldErrors<SingleWeight> | undefined;
  disabled?: boolean;
};

export const WeightSingleFields = ({
  value,
  onChange,
  error,
  disabled = false,
}: WeightSingleFieldsProps) => {
  return (
    <TextField
      label="Weight (kg)"
      type="number"
      size="small"
      value={typeof value.valueKg === "number" ? value.valueKg : ""}
      onChange={(e) => onChange({ ...value, valueKg: Number(e.target.value) })}
      inputProps={{ min: 0, step: 0.5 }}
      error={error?.valueKg !== undefined}
      helperText={error?.valueKg?.message}
      disabled={disabled}
      sx={{ maxWidth: 160 }}
    />
  );
};

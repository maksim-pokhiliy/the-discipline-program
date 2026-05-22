"use client";

import { TextField } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { Weight } from "@repo/contracts/lms/_shared";

type DualWeight = Extract<Weight, { variant: "dual" }>;

type WeightDualFieldsProps = {
  value: DualWeight;
  onChange: (next: DualWeight) => void;
  error?: FieldErrors<DualWeight> | undefined;
  disabled?: boolean;
};

export const WeightDualFields = ({
  value,
  onChange,
  error,
  disabled = false,
}: WeightDualFieldsProps) => {
  return (
    <TextField
      label="Weight per side (kg)"
      type="number"
      size="small"
      value={typeof value.valueKg === "number" ? value.valueKg : ""}
      onChange={(e) => onChange({ ...value, valueKg: Number(e.target.value) })}
      inputProps={{ min: 0, step: 0.5 }}
      error={error?.valueKg !== undefined}
      helperText={error?.valueKg?.message}
      disabled={disabled}
      sx={{ maxWidth: 200 }}
    />
  );
};

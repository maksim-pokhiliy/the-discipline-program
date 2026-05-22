"use client";

import { TextField } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { Weight } from "@repo/contracts/lms/_shared";

type SingleArmWeight = Extract<Weight, { variant: "single_arm" }>;

type WeightSingleArmFieldsProps = {
  value: SingleArmWeight;
  onChange: (next: SingleArmWeight) => void;
  error?: FieldErrors<SingleArmWeight> | undefined;
  disabled?: boolean;
};

export const WeightSingleArmFields = ({
  value,
  onChange,
  error,
  disabled = false,
}: WeightSingleArmFieldsProps) => {
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

"use client";

import { Stack, TextField } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { Weight } from "@repo/contracts/lms/_shared";

type DualValueWeight = Extract<Weight, { variant: "dual_value" }>;

type WeightDualValueFieldsProps = {
  value: DualValueWeight;
  onChange: (next: DualValueWeight) => void;
  error?: FieldErrors<DualValueWeight> | undefined;
  disabled?: boolean;
};

export const WeightDualValueFields = ({
  value,
  onChange,
  error,
  disabled = false,
}: WeightDualValueFieldsProps) => {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
      <TextField
        label="First value (kg)"
        type="number"
        size="small"
        value={typeof value.first === "number" ? value.first : ""}
        onChange={(e) => onChange({ ...value, first: Number(e.target.value) })}
        inputProps={{ min: 0, step: 0.5 }}
        error={error?.first !== undefined}
        helperText={error?.first?.message}
        disabled={disabled}
        sx={{ maxWidth: 160 }}
      />

      <TextField
        label="Second value (kg)"
        type="number"
        size="small"
        value={typeof value.second === "number" ? value.second : ""}
        onChange={(e) => onChange({ ...value, second: Number(e.target.value) })}
        inputProps={{ min: 0, step: 0.5 }}
        error={error?.second !== undefined}
        helperText={error?.second?.message}
        disabled={disabled}
        sx={{ maxWidth: 160 }}
      />
    </Stack>
  );
};

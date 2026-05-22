"use client";

import { FormControl, InputLabel, MenuItem, Select, Stack, TextField } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import {
  WEIGHT_DEPTH_MODIFIERS,
  type Weight,
  type WeightDepthModifier,
} from "@repo/contracts/lms/_shared";

type DepthModifierWeight = Extract<Weight, { variant: "with_depth_modifier" }>;

const DEPTH_MODIFIER_LABELS: Record<WeightDepthModifier, string> = {
  to_parallel: "To parallel",
  full_rom: "Full ROM",
  partial: "Partial",
};

type WeightDepthModifierFieldsProps = {
  value: DepthModifierWeight;
  onChange: (next: DepthModifierWeight) => void;
  error?: FieldErrors<DepthModifierWeight> | undefined;
  disabled?: boolean;
};

export const WeightDepthModifierFields = ({
  value,
  onChange,
  error,
  disabled = false,
}: WeightDepthModifierFieldsProps) => {
  return (
    <Stack spacing={1.5}>
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

      <FormControl
        size="small"
        sx={{ minWidth: 180 }}
        disabled={disabled}
        error={error?.depth !== undefined}
      >
        <InputLabel>Depth</InputLabel>
        <Select
          value={value.depth}
          label="Depth"
          onChange={(e) => onChange({ ...value, depth: e.target.value as WeightDepthModifier })}
        >
          {WEIGHT_DEPTH_MODIFIERS.map((depth) => (
            <MenuItem key={depth} value={depth}>
              {DEPTH_MODIFIER_LABELS[depth]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
};

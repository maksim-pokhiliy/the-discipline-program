"use client";

import { Stack, TextField, ToggleButton, Typography } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import {
  WEIGHT_DEPTH_MODIFIERS,
  type Weight,
  type WeightDepthModifier,
} from "@repo/contracts/lms/_shared";
import { LabeledToggleGroup } from "@repo/ui";

type DepthModifierWeight = Extract<Weight, { variant: "with_depth_modifier" }>;

const DEPTH_MODIFIER_LABELS: Record<WeightDepthModifier, string> = {
  to_parallel: "to parallel",
  full_rom: "full ROM",
  partial: "partial",
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
  const handleDepthChange = (_: unknown, next: WeightDepthModifier | null) => {
    if (next === null) {
      return;
    }

    onChange({ ...value, depth: next });
  };

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

      <LabeledToggleGroup
        label="depth"
        value={value.depth}
        onChange={handleDepthChange}
        disabled={disabled}
        helper={
          error?.depth !== undefined ? (
            <Typography variant="caption" color="error">
              {error.depth.message}
            </Typography>
          ) : undefined
        }
      >
        {WEIGHT_DEPTH_MODIFIERS.map((depth) => (
          <ToggleButton key={depth} value={depth}>
            {DEPTH_MODIFIER_LABELS[depth]}
          </ToggleButton>
        ))}
      </LabeledToggleGroup>
    </Stack>
  );
};

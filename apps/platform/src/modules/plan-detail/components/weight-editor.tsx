"use client";

import { FormControl, InputLabel, MenuItem, Select, Stack } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import { WEIGHT_VARIANTS, type Weight, type WeightVariant } from "@repo/contracts/lms/_shared";

import { WeightAsymmetricArmFields } from "./weight-asymmetric-arm-fields";
import { WeightCompoundDeviceFields } from "./weight-compound-device-fields";
import { WeightDepthModifierFields } from "./weight-depth-modifier-fields";
import { WeightDualFields } from "./weight-dual-fields";
import { buildDefaultWeight } from "./weight-load-defaults";
import { WeightSingleArmFields } from "./weight-single-arm-fields";
import { WeightSingleFields } from "./weight-single-fields";
import { WeightSplitTierFields } from "./weight-split-tier-fields";

const WEIGHT_VARIANT_LABELS: Record<WeightVariant, string> = {
  single: "Single",
  dual: "Dual (per side)",
  single_arm: "Single arm",
  compound_device: "Compound device",
  split_tier: "Split tier",
  with_asymmetric_arm: "Asymmetric arm",
  with_depth_modifier: "With depth",
};

type WeightEditorProps = {
  value: Weight;
  onChange: (next: Weight) => void;
  error?: FieldErrors<Weight> | undefined;
  disabled?: boolean;
};

export const WeightEditor = ({ value, onChange, error, disabled = false }: WeightEditorProps) => {
  const handleVariantChange = (nextVariant: WeightVariant) => {
    onChange(buildDefaultWeight(nextVariant));
  };

  const renderVariant = (): React.ReactNode => {
    switch (value.variant) {
      case "single":
        return (
          <WeightSingleFields value={value} onChange={onChange} error={error} disabled={disabled} />
        );
      case "dual":
        return (
          <WeightDualFields value={value} onChange={onChange} error={error} disabled={disabled} />
        );
      case "single_arm":
        return (
          <WeightSingleArmFields
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        );
      case "compound_device":
        return (
          <WeightCompoundDeviceFields
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        );
      case "split_tier":
        return (
          <WeightSplitTierFields
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        );
      case "with_asymmetric_arm":
        return (
          <WeightAsymmetricArmFields
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        );
      case "with_depth_modifier":
        return (
          <WeightDepthModifierFields
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <Stack spacing={1.5}>
      <FormControl size="small" sx={{ minWidth: 220 }} disabled={disabled}>
        <InputLabel>Weight format</InputLabel>
        <Select
          value={value.variant}
          label="Weight format"
          onChange={(e) => handleVariantChange(e.target.value as WeightVariant)}
        >
          {WEIGHT_VARIANTS.map((variant) => (
            <MenuItem key={variant} value={variant}>
              {WEIGHT_VARIANT_LABELS[variant]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {renderVariant()}
    </Stack>
  );
};

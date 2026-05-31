"use client";

import { Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import {
  EXPLICIT_SPLIT_SIDES,
  type ExplicitSplitSide,
  type PerLimbDistribution,
  type PerLimbKind,
} from "@repo/contracts/lms/_shared";
import { LabeledToggleGroup } from "@repo/ui";

const SIDE_NONE = "none";

type SideOption = typeof SIDE_NONE | PerLimbKind;

const SIDE_OPTIONS: readonly SideOption[] = [
  SIDE_NONE,
  "each_leg",
  "each_arm",
  "explicit_split",
  "alternating",
];

const SIDE_OPTION_LABELS: Record<SideOption, string> = {
  none: "—",
  each_leg: "each leg",
  each_arm: "each arm",
  explicit_split: "L / R",
  alternating: "alt.",
};

const EXPLICIT_SPLIT_SIDE_LABELS: Record<ExplicitSplitSide, string> = {
  left: "Left",
  right: "Right",
};

const COUNT_PER_LIMB_FIELD_WIDTH = 80;
const COUNT_PER_LIMB_HELPER = "count per limb (optional):";

const buildDefaultSide = (option: SideOption): PerLimbDistribution | null => {
  switch (option) {
    case "none":
      return null;
    case "each_leg":
      return { kind: "each_leg" };
    case "each_arm":
      return { kind: "each_arm" };
    case "explicit_split":
      return { kind: "explicit_split", side: "left" };
    case "alternating":
      return { kind: "alternating" };
  }
};

type SideEditorProps = {
  value: PerLimbDistribution | null;
  onChange: (next: PerLimbDistribution | null) => void;
  error?: FieldErrors<PerLimbDistribution> | undefined;
  disabled?: boolean;
};

export const SideEditor = ({ value, onChange, disabled = false }: SideEditorProps) => {
  const selected: SideOption = value?.kind ?? SIDE_NONE;

  const handleOptionChange = (_: unknown, next: SideOption | null): void => {
    if (next === null) {
      return;
    }

    onChange(buildDefaultSide(next));
  };

  const handleCountChange = (raw: string): void => {
    if (value === null || (value.kind !== "each_leg" && value.kind !== "each_arm")) {
      return;
    }

    onChange({ kind: value.kind, ...(raw !== "" && { countPerLimb: Number(raw) }) });
  };

  const handleSplitSideChange = (_: unknown, next: ExplicitSplitSide | null): void => {
    if (next === null) {
      return;
    }

    onChange({ kind: "explicit_split", side: next });
  };

  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup
        aria-label="side distribution"
        value={selected}
        exclusive
        onChange={handleOptionChange}
        size="small"
        disabled={disabled}
      >
        {SIDE_OPTIONS.map((option) => (
          <ToggleButton key={option} value={option}>
            {SIDE_OPTION_LABELS[option]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {value !== null && (value.kind === "each_leg" || value.kind === "each_arm") && (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="caption" color="text.subtle">
            {COUNT_PER_LIMB_HELPER}
          </Typography>

          <TextField
            type="number"
            size="small"
            value={value.countPerLimb ?? ""}
            onChange={(e) => handleCountChange(e.target.value)}
            inputProps={{ min: 1, step: 1 }}
            disabled={disabled}
            sx={{ maxWidth: COUNT_PER_LIMB_FIELD_WIDTH }}
          />
        </Stack>
      )}

      {value !== null && value.kind === "explicit_split" && (
        <LabeledToggleGroup
          label="side"
          value={value.side}
          onChange={handleSplitSideChange}
          disabled={disabled}
        >
          {EXPLICIT_SPLIT_SIDES.map((side) => (
            <ToggleButton key={side} value={side}>
              {EXPLICIT_SPLIT_SIDE_LABELS[side]}
            </ToggleButton>
          ))}
        </LabeledToggleGroup>
      )}
    </Stack>
  );
};

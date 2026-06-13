"use client";

import { Stack, ToggleButton } from "@mui/material";

import { type PerLimbDistribution } from "@repo/contracts/lms/_shared";
import { LabeledToggleGroup } from "@repo/ui";

import { NumberField } from "./number-field";

const LABEL = "side";
const COUNT_FIELD_MIN = 1;
const COUNT_FIELD_WIDTH = 110;

const SIDE_OPTIONS = ["none", "each_arm", "each_leg", "alternating", "left", "right"] as const;

type SideOption = (typeof SIDE_OPTIONS)[number];

const SIDE_OPTION_LABELS: Record<SideOption, string> = {
  none: "—",
  each_arm: "Each arm",
  each_leg: "Each leg",
  alternating: "Alternating",
  left: "Left",
  right: "Right",
};

const toOption = (value: PerLimbDistribution | null): SideOption => {
  if (value === null) {
    return "none";
  }

  switch (value.kind) {
    case "each_arm":
      return "each_arm";
    case "each_leg":
      return "each_leg";
    case "alternating":
      return "alternating";
    case "explicit_split":
      return value.side;
    default:
      value satisfies never;

      return "none";
  }
};

const toDistribution = (option: SideOption): PerLimbDistribution | null => {
  switch (option) {
    case "none":
      return null;
    case "each_arm":
      return { kind: "each_arm" };
    case "each_leg":
      return { kind: "each_leg" };
    case "alternating":
      return { kind: "alternating" };
    case "left":
      return { kind: "explicit_split", side: "left" };
    case "right":
      return { kind: "explicit_split", side: "right" };
    default:
      option satisfies never;

      return null;
  }
};

const hasPerLimbCount = (
  value: PerLimbDistribution | null,
): value is Extract<PerLimbDistribution, { kind: "each_arm" | "each_leg" }> =>
  value !== null && (value.kind === "each_arm" || value.kind === "each_leg");

type SideFieldProps = {
  value: PerLimbDistribution | null;
  onChange: (next: PerLimbDistribution | null) => void;
  disabled?: boolean;
};

export const SideField = ({
  value,
  onChange,
  disabled = false,
}: SideFieldProps): React.ReactElement => {
  const handleOptionChange = (_: unknown, option: SideOption | null): void => {
    if (option === null) {
      return;
    }

    onChange(toDistribution(option));
  };

  const handleCountChange = (countPerLimb: number): void => {
    if (!hasPerLimbCount(value)) {
      return;
    }

    onChange(countPerLimb > 0 ? { kind: value.kind, countPerLimb } : { kind: value.kind });
  };

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
      <LabeledToggleGroup
        label={LABEL}
        value={toOption(value)}
        onChange={handleOptionChange}
        disabled={disabled}
      >
        {SIDE_OPTIONS.map((option) => (
          <ToggleButton key={option} value={option}>
            {SIDE_OPTION_LABELS[option]}
          </ToggleButton>
        ))}
      </LabeledToggleGroup>

      {hasPerLimbCount(value) && (
        <NumberField
          label="Per limb"
          value={value.countPerLimb ?? Number.NaN}
          onChange={handleCountChange}
          min={COUNT_FIELD_MIN}
          disabled={disabled}
          maxWidth={COUNT_FIELD_WIDTH}
        />
      )}
    </Stack>
  );
};

"use client";

import { ToggleButton, ToggleButtonGroup } from "@mui/material";

import { PACE_VALUES, type PaceValue } from "@repo/contracts/lms/_shared";
import { ToggleSection } from "@repo/ui";

const PACE_DEFAULT_VALUE: PaceValue = "moderate";

const PACE_LABELS: Record<PaceValue, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
  recovery: "Recovery",
};

type PaceFieldProps = {
  value: PaceValue | undefined;
  onChange: (next: PaceValue | undefined) => void;
  disabled?: boolean;
};

export const PaceField = ({ value, onChange, disabled = false }: PaceFieldProps) => {
  const isOn = value !== undefined;

  const handleToggle = () => {
    onChange(isOn ? undefined : PACE_DEFAULT_VALUE);
  };

  const handleChange = (_: unknown, next: PaceValue | null) => {
    if (next !== null) {
      onChange(next);
    }
  };

  return (
    <ToggleSection
      on={isOn}
      label="Pace"
      helper="qualitative"
      onToggle={handleToggle}
      disabled={disabled}
    >
      <ToggleButtonGroup
        aria-label="Pace"
        exclusive
        size="small"
        value={value ?? null}
        onChange={handleChange}
        disabled={disabled}
      >
        {PACE_VALUES.map((p) => (
          <ToggleButton key={p} value={p}>
            {PACE_LABELS[p]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </ToggleSection>
  );
};

"use client";

import { ToggleButton, ToggleButtonGroup } from "@mui/material";

import type { RpeIntensity } from "@repo/contracts/lms/_shared";
import { ToggleSection } from "@repo/ui";

const RPE_DEFAULT_VALUE = 8;
const RPE_VALUES = [5, 6, 7, 7.5, 8, 8.5, 9, 9.5, 10] as const;

type RpeFieldProps = {
  value: RpeIntensity | undefined;
  onChange: (next: RpeIntensity | undefined) => void;
  disabled?: boolean;
};

export const RpeField = ({ value, onChange, disabled = false }: RpeFieldProps) => {
  const isOn = value !== undefined;

  const handleToggle = () => {
    onChange(isOn ? undefined : { value: RPE_DEFAULT_VALUE });
  };

  const handleChange = (_: unknown, next: number | null) => {
    if (next !== null) {
      onChange({ value: next });
    }
  };

  return (
    <ToggleSection
      on={isOn}
      label="RPE"
      helper="rate of perceived exertion 1–10"
      onToggle={handleToggle}
      disabled={disabled}
    >
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value?.value ?? null}
        onChange={handleChange}
        disabled={disabled}
      >
        {RPE_VALUES.map((n) => (
          <ToggleButton key={n} value={n}>
            {n}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </ToggleSection>
  );
};

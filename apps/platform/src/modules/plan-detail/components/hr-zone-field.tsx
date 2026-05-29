"use client";

import { ToggleButton, ToggleButtonGroup } from "@mui/material";

import { HR_ZONES, type HrZoneIntensity } from "@repo/contracts/lms/_shared";
import { ToggleSection } from "@repo/ui";

const HR_ZONE_DEFAULT: HrZoneIntensity = { zone: "Z2" };

type HrZoneFieldProps = {
  value: HrZoneIntensity | undefined;
  onChange: (next: HrZoneIntensity | undefined) => void;
  disabled?: boolean;
};

export const HrZoneField = ({ value, onChange, disabled = false }: HrZoneFieldProps) => {
  const isOn = value !== undefined;

  const handleToggle = () => {
    onChange(isOn ? undefined : HR_ZONE_DEFAULT);
  };

  const handleZoneChange = (_: unknown, zone: (typeof HR_ZONES)[number] | null) => {
    if (zone === null) {
      return;
    }

    onChange({ zone });
  };

  return (
    <ToggleSection on={isOn} label="HR zone" onToggle={handleToggle} disabled={disabled}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value?.zone ?? null}
        onChange={handleZoneChange}
        disabled={disabled}
      >
        {HR_ZONES.map((zone) => (
          <ToggleButton key={zone} value={zone}>
            {zone}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </ToggleSection>
  );
};

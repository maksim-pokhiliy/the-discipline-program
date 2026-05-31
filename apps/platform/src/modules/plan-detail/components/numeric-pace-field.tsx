"use client";

import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import {
  NUMERIC_PACE_DISTANCE_UNITS,
  NUMERIC_PACE_TYPES,
  type NumericPaceIntensity,
} from "@repo/contracts/lms/_shared";
import { ToggleSection } from "@repo/ui";

const NUMERIC_PACE_DEFAULT: NumericPaceIntensity = {
  value: "5:00",
  distanceUnit: "km",
  paceType: "min_per_distance",
};

const PACE_TYPE_LABELS: Record<(typeof NUMERIC_PACE_TYPES)[number], string> = {
  min_per_distance: "time / dist",
  distance_per_min: "dist / min",
};

const VALUE_FIELD_WIDTH = 90;
const UNIT_FIELD_WIDTH = 90;

type NumericPaceFieldProps = {
  value: NumericPaceIntensity | undefined;
  onChange: (next: NumericPaceIntensity | undefined) => void;
  error?: FieldErrors<NumericPaceIntensity> | undefined;
  disabled?: boolean;
};

export const NumericPaceField = ({
  value,
  onChange,
  error,
  disabled = false,
}: NumericPaceFieldProps) => {
  const isOn = value !== undefined;

  const handleToggle = () => {
    onChange(isOn ? undefined : NUMERIC_PACE_DEFAULT);
  };

  const handlePaceTypeChange = (
    _: unknown,
    paceType: (typeof NUMERIC_PACE_TYPES)[number] | null,
  ) => {
    if (paceType === null || value === undefined) {
      return;
    }

    onChange({ ...value, paceType });
  };

  return (
    <ToggleSection
      on={isOn}
      label="Numeric pace"
      helper="time per distance / distance per minute"
      onToggle={handleToggle}
      disabled={disabled}
    >
      {value !== undefined && (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            size="small"
            value={value.value}
            onChange={(e) => onChange({ ...value, value: e.target.value })}
            placeholder="5:00"
            error={error?.value !== undefined}
            helperText={error?.value?.message}
            disabled={disabled}
            sx={{ maxWidth: VALUE_FIELD_WIDTH }}
          />

          <FormControl size="small" sx={{ minWidth: UNIT_FIELD_WIDTH }} disabled={disabled}>
            <InputLabel>Distance</InputLabel>
            <Select<(typeof NUMERIC_PACE_DISTANCE_UNITS)[number]>
              value={value.distanceUnit}
              label="Distance"
              onChange={(e) => onChange({ ...value, distanceUnit: e.target.value })}
            >
              {NUMERIC_PACE_DISTANCE_UNITS.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <ToggleButtonGroup
            aria-label="pace type"
            exclusive
            size="small"
            value={value.paceType}
            onChange={handlePaceTypeChange}
            disabled={disabled}
          >
            {NUMERIC_PACE_TYPES.map((t) => (
              <ToggleButton key={t} value={t}>
                {PACE_TYPE_LABELS[t]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      )}
    </ToggleSection>
  );
};

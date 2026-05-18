"use client";

import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from "@mui/material";

import {
  NUMERIC_PACE_DISTANCE_UNITS,
  NUMERIC_PACE_TYPES,
  type NumericPaceIntensity,
} from "@repo/contracts/lms/_shared";

const PACE_TYPE_LABELS: Record<(typeof NUMERIC_PACE_TYPES)[number], string> = {
  min_per_distance: "min/distance",
  distance_per_min: "distance/min",
};

type NumericPaceFieldProps = {
  value: NumericPaceIntensity | undefined;
  onChange: (next: NumericPaceIntensity | undefined) => void;
  disabled?: boolean;
};

export const NumericPaceField = ({ value, onChange, disabled = false }: NumericPaceFieldProps) => {
  const enabled = value !== undefined;

  const handleToggle = (_: unknown, next: boolean) => {
    if (next) {
      onChange({ value: "1:50", distanceUnit: "km", paceType: "min_per_distance" });
    } else {
      onChange(undefined);
    }
  };

  return (
    <Box>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={handleToggle} disabled={disabled} />}
        label="Numeric pace"
      />

      {enabled && value !== undefined && (
        <Stack direction="row" spacing={1} sx={{ pl: 4, pt: 1, flexWrap: "wrap" }}>
          <TextField
            label="Value (e.g. 1:50)"
            size="small"
            value={value.value}
            onChange={(e) => onChange({ ...value, value: e.target.value })}
            disabled={disabled}
            sx={{ maxWidth: 160 }}
          />
          <FormControl size="small" sx={{ maxWidth: 120 }} disabled={disabled}>
            <InputLabel>Distance</InputLabel>
            <Select
              value={value.distanceUnit}
              label="Distance"
              onChange={(e) =>
                onChange({
                  ...value,
                  distanceUnit: e.target.value as (typeof NUMERIC_PACE_DISTANCE_UNITS)[number],
                })
              }
            >
              {NUMERIC_PACE_DISTANCE_UNITS.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }} disabled={disabled}>
            <InputLabel>Direction</InputLabel>
            <Select
              value={value.paceType}
              label="Direction"
              onChange={(e) =>
                onChange({
                  ...value,
                  paceType: e.target.value as (typeof NUMERIC_PACE_TYPES)[number],
                })
              }
            >
              {NUMERIC_PACE_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {PACE_TYPE_LABELS[t]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      )}
    </Box>
  );
};

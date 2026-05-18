"use client";

import {
  Box,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import { TIME_CAP_UNITS, type TimeCap, type TimeCapUnit } from "@repo/contracts/lms/_shared";

type TimeCapFieldsProps = {
  value: TimeCap | null;
  onChange: (next: TimeCap | null) => void;
  disabled?: boolean;
};

export const TimeCapFields = ({ value, onChange, disabled = false }: TimeCapFieldsProps) => {
  const enabled = value !== null;
  const rangeEnabled = value !== null && value.max !== undefined;

  const handleSectionToggle = (_: unknown, next: boolean) => {
    if (next) {
      onChange({ min: 5, unit: "min" });
    } else {
      onChange(null);
    }
  };

  const handleRangeToggle = (_: unknown, next: boolean) => {
    if (value === null) {
      return;
    }

    if (next) {
      onChange({ ...value, max: value.min + 5 });
    } else {
      onChange({ min: value.min, unit: value.unit });
    }
  };

  const handleMinChange = (n: number) => {
    if (value === null) {
      return;
    }

    onChange({ ...value, min: n });
  };
  const handleMaxChange = (n: number) => {
    if (value === null) {
      return;
    }

    onChange({ ...value, max: n });
  };
  const handleUnitChange = (_: unknown, next: TimeCapUnit | null) => {
    if (next === null || value === null) {
      return;
    }

    onChange({ ...value, unit: next });
  };

  return (
    <Box>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={handleSectionToggle} disabled={disabled} />}
        label="Time cap"
      />

      {enabled && value !== null && (
        <Stack spacing={1.5} sx={{ pl: 4, pt: 1 }}>
          <Stack direction="row" spacing={1}>
            <TextField
              label="Min"
              type="number"
              size="small"
              value={value.min}
              onChange={(e) => handleMinChange(Number(e.target.value))}
              inputProps={{ min: 1, step: 1 }}
              disabled={disabled}
              sx={{ maxWidth: 120 }}
            />
            {rangeEnabled && (
              <TextField
                label="Max"
                type="number"
                size="small"
                value={value.max ?? 0}
                onChange={(e) => handleMaxChange(Number(e.target.value))}
                inputProps={{ min: 1, step: 1 }}
                disabled={disabled}
                sx={{ maxWidth: 120 }}
              />
            )}
          </Stack>

          <FormControlLabel
            control={
              <Switch checked={rangeEnabled} onChange={handleRangeToggle} disabled={disabled} />
            }
            label="Add range max"
          />

          <ToggleButtonGroup
            value={value.unit}
            exclusive
            onChange={handleUnitChange}
            size="small"
            disabled={disabled}
          >
            {TIME_CAP_UNITS.map((u) => (
              <ToggleButton key={u} value={u}>
                {u}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      )}
    </Box>
  );
};

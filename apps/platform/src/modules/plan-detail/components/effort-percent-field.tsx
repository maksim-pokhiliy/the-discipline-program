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

import type { EffortPercent } from "@repo/contracts/lms/_shared";

type EffortPercentFieldProps = {
  value: EffortPercent | undefined;
  onChange: (next: EffortPercent | undefined) => void;
  disabled?: boolean;
};

export const EffortPercentField = ({
  value,
  onChange,
  disabled = false,
}: EffortPercentFieldProps) => {
  const enabled = value !== undefined;
  const mode: "value" | "range" = value !== undefined && "range" in value ? "range" : "value";

  const handleToggle = (_: unknown, next: boolean) => {
    if (next) {
      onChange({ value: 70 });
    } else {
      onChange(undefined);
    }
  };

  const handleModeChange = (_: unknown, next: "value" | "range" | null) => {
    if (next === null) {
      return;
    }

    if (next === "value") {
      onChange({ value: 70 });
    } else {
      onChange({ range: { min: 70, max: 80 } });
    }
  };

  const handleValueChange = (n: number) => onChange({ value: n });
  const handleRangeMinChange = (n: number) => {
    if (value !== undefined && "range" in value) {
      onChange({ range: { min: n, max: value.range.max } });
    }
  };
  const handleRangeMaxChange = (n: number) => {
    if (value !== undefined && "range" in value) {
      onChange({ range: { min: value.range.min, max: n } });
    }
  };

  return (
    <Box>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={handleToggle} disabled={disabled} />}
        label="Effort %"
      />

      {enabled && (
        <Stack spacing={1.5} sx={{ pl: 4, pt: 1 }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleModeChange}
            size="small"
            disabled={disabled}
          >
            <ToggleButton value="value">Single</ToggleButton>
            <ToggleButton value="range">Range</ToggleButton>
          </ToggleButtonGroup>

          {mode === "value" && value !== undefined && "value" in value && (
            <TextField
              label="Value %"
              type="number"
              size="small"
              value={value.value}
              onChange={(e) => handleValueChange(Number(e.target.value))}
              inputProps={{ min: 1, max: 100 }}
              disabled={disabled}
              sx={{ maxWidth: 160 }}
            />
          )}

          {mode === "range" && value !== undefined && "range" in value && (
            <Stack direction="row" spacing={1}>
              <TextField
                label="Min %"
                type="number"
                size="small"
                value={value.range.min}
                onChange={(e) => handleRangeMinChange(Number(e.target.value))}
                inputProps={{ min: 1, max: 100 }}
                disabled={disabled}
                sx={{ maxWidth: 120 }}
              />
              <TextField
                label="Max %"
                type="number"
                size="small"
                value={value.range.max}
                onChange={(e) => handleRangeMaxChange(Number(e.target.value))}
                inputProps={{ min: 1, max: 100 }}
                disabled={disabled}
                sx={{ maxWidth: 120 }}
              />
            </Stack>
          )}
        </Stack>
      )}
    </Box>
  );
};

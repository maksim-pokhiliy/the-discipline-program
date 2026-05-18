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
} from "@mui/material";

import { PACE_VALUES, type PaceValue } from "@repo/contracts/lms/_shared";

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
  const enabled = value !== undefined;

  const handleToggle = (_: unknown, next: boolean) => {
    if (next) {
      onChange("easy");
    } else {
      onChange(undefined);
    }
  };

  return (
    <Box>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={handleToggle} disabled={disabled} />}
        label="Pace"
      />

      {enabled && value !== undefined && (
        <Stack sx={{ pl: 4, pt: 1 }}>
          <FormControl size="small" sx={{ maxWidth: 200 }} disabled={disabled}>
            <InputLabel>Pace</InputLabel>
            <Select
              value={value}
              label="Pace"
              onChange={(e) => onChange(e.target.value as PaceValue)}
            >
              {PACE_VALUES.map((p) => (
                <MenuItem key={p} value={p}>
                  {PACE_LABELS[p]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      )}
    </Box>
  );
};

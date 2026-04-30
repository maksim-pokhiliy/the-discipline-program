"use client";

import { Stack, TextField } from "@mui/material";

import { type SchemeFormCountDownProps } from "./scheme-form.types";

const parsePositiveInt = (raw: string, fallback: number): number => {
  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

export const SchemeFormCountDown = ({
  value,
  onChange,
  disabled = false,
}: SchemeFormCountDownProps) => {
  const handleDurationChange = (raw: string) => {
    const next = parsePositiveInt(raw, value.durationSec);

    onChange({ ...value, durationSec: next });
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Duration (seconds)"
        type="number"
        size="small"
        value={value.durationSec}
        onChange={(event) => handleDurationChange(event.target.value)}
        disabled={disabled}
        helperText="Total countdown for the segment"
        inputProps={{ min: 1 }}
        required
      />
    </Stack>
  );
};

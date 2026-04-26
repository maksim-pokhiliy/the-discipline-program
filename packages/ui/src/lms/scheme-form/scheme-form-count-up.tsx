"use client";

import { Stack, TextField } from "@mui/material";

import { type SchemeFormCountUpProps } from "./scheme-form.types";

const parseOptionalInt = (raw: string): number | undefined => {
  const trimmed = raw.trim();

  if (trimmed === "") {
    return undefined;
  }

  const parsed = Number.parseInt(trimmed, 10);

  return Number.isFinite(parsed) ? parsed : undefined;
};

export const SchemeFormCountUp = ({
  value,
  onChange,
  disabled = false,
}: SchemeFormCountUpProps) => {
  const handleCapChange = (raw: string) => {
    const cap = parseOptionalInt(raw);

    onChange({ ...value, cap });
  };

  const handleRoundsChange = (raw: string) => {
    const rounds = parseOptionalInt(raw);

    onChange({ ...value, rounds });
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Cap (seconds)"
        type="number"
        size="small"
        value={value.cap ?? ""}
        onChange={(event) => handleCapChange(event.target.value)}
        disabled={disabled}
        helperText="Optional time cap for AMRAP-style work"
        inputProps={{ min: 1 }}
      />
      <TextField
        label="Rounds"
        type="number"
        size="small"
        value={value.rounds ?? ""}
        onChange={(event) => handleRoundsChange(event.target.value)}
        disabled={disabled}
        helperText="Optional fixed round count"
        inputProps={{ min: 1 }}
      />
    </Stack>
  );
};

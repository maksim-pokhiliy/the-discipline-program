"use client";

import { Button, Stack, TextField, Typography } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

const RANGE_INCREMENT = 1;
const COUNT_FIELD_WIDTH = 90;
const RANGE_FIELD_WIDTH = 80;
const COUNT_FIELD_MIN = 1;
const COUNT_FIELD_STEP = 1;
const EN_DASH = "–";

export type CountOrRangeValue = number | { min: number; max: number };

type CountOrRangeProps = {
  value: CountOrRangeValue;
  onChange: (next: CountOrRangeValue) => void;
  error?: FieldErrors<{ min: number; max: number }> | undefined;
  disabled?: boolean;
};

export const CountOrRange = ({ value, onChange, error, disabled = false }: CountOrRangeProps) => {
  const hasError = error?.root?.message !== undefined;

  if (typeof value === "object") {
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          label="Min"
          type="number"
          size="small"
          value={value.min}
          onChange={(e) => onChange({ min: Number(e.target.value), max: value.max })}
          inputProps={{ min: COUNT_FIELD_MIN, step: COUNT_FIELD_STEP }}
          error={hasError}
          disabled={disabled}
          sx={{ maxWidth: RANGE_FIELD_WIDTH }}
        />

        <Typography variant="body2" color="text.subtle">
          {EN_DASH}
        </Typography>

        <TextField
          label="Max"
          type="number"
          size="small"
          value={value.max}
          onChange={(e) => onChange({ min: value.min, max: Number(e.target.value) })}
          inputProps={{ min: COUNT_FIELD_MIN, step: COUNT_FIELD_STEP }}
          error={hasError}
          helperText={error?.root?.message}
          disabled={disabled}
          sx={{ maxWidth: RANGE_FIELD_WIDTH }}
        />

        <Button size="tiny" variant="text" disabled={disabled} onClick={() => onChange(value.min)}>
          exact
        </Button>
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
      <TextField
        label="Count"
        type="number"
        size="small"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        inputProps={{ min: COUNT_FIELD_MIN, step: COUNT_FIELD_STEP }}
        error={hasError}
        helperText={error?.root?.message}
        disabled={disabled}
        sx={{ maxWidth: COUNT_FIELD_WIDTH }}
      />

      <Button
        size="tiny"
        variant="text"
        disabled={disabled}
        onClick={() => onChange({ min: value, max: value + RANGE_INCREMENT })}
      >
        range
      </Button>
    </Stack>
  );
};

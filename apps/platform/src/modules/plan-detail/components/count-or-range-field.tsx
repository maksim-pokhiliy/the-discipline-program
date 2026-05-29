"use client";

import { Button, Stack, Typography } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import { NumberField } from "./number-field";

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
  const rootError = error?.root?.message;

  if (typeof value === "object") {
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <NumberField
          label="Min"
          value={value.min}
          onChange={(min) => onChange({ min, max: value.max })}
          min={COUNT_FIELD_MIN}
          step={COUNT_FIELD_STEP}
          disabled={disabled}
          maxWidth={RANGE_FIELD_WIDTH}
        />

        <Typography variant="body2" color="text.subtle">
          {EN_DASH}
        </Typography>

        <NumberField
          label="Max"
          value={value.max}
          onChange={(max) => onChange({ min: value.min, max })}
          min={COUNT_FIELD_MIN}
          step={COUNT_FIELD_STEP}
          error={rootError}
          disabled={disabled}
          maxWidth={RANGE_FIELD_WIDTH}
        />

        <Button size="tiny" variant="text" disabled={disabled} onClick={() => onChange(value.min)}>
          exact
        </Button>
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
      <NumberField
        label="Count"
        value={value}
        onChange={onChange}
        min={COUNT_FIELD_MIN}
        step={COUNT_FIELD_STEP}
        error={rootError}
        disabled={disabled}
        maxWidth={COUNT_FIELD_WIDTH}
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

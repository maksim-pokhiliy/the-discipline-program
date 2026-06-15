"use client";

import { TextField } from "@mui/material";

export const NUMBER_FIELD_DEFAULT_WIDTH = 140;

type NumberFieldProps = {
  value: number;
  onChange: (next: number) => void;
  label?: string | undefined;
  min?: number | undefined;
  step?: number | undefined;
  error?: string | undefined;
  disabled?: boolean | undefined;
  maxWidth?: number | undefined;
  placeholder?: string | undefined;
};

export const NumberField = ({
  value,
  onChange,
  label,
  min,
  step,
  error,
  disabled = false,
  maxWidth,
  placeholder,
}: NumberFieldProps): React.ReactElement => (
  <TextField
    type="number"
    size="small"
    label={label}
    value={Number.isFinite(value) ? value : ""}
    onChange={(e) => onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))}
    inputProps={{ min, step }}
    error={error !== undefined}
    helperText={error}
    disabled={disabled}
    sx={{ maxWidth: maxWidth ?? NUMBER_FIELD_DEFAULT_WIDTH }}
    {...(placeholder !== undefined && { placeholder })}
  />
);

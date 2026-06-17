"use client";

import { TextField } from "@mui/material";

export const NUMBER_FIELD_DEFAULT_WIDTH = 140;

type NumberFieldProps = {
  value: number;
  onChange: (next: number) => void;
  label?: string | undefined;
  min?: number | undefined;
  step?: number | "any" | undefined;
  error?: string | undefined;
  disabled?: boolean | undefined;
  maxWidth?: number | undefined;
  placeholder?: string | undefined;
  ariaLabel?: string | undefined;
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
  ariaLabel,
}: NumberFieldProps): React.ReactElement => (
  <TextField
    type="number"
    size="small"
    label={label}
    value={Number.isFinite(value) ? value : ""}
    onChange={(e) => onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))}
    inputProps={{ min, step, ...(ariaLabel !== undefined && { "aria-label": ariaLabel }) }}
    error={error !== undefined}
    helperText={error}
    disabled={disabled}
    sx={{ maxWidth: maxWidth ?? NUMBER_FIELD_DEFAULT_WIDTH }}
    {...(placeholder !== undefined && { placeholder })}
  />
);

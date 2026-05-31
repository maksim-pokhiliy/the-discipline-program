"use client";

import { Stack, TextField, Typography } from "@mui/material";

const TEMPO_DIGIT_WIDTH_PX = 44;
const TEMPO_DIGIT_MIN = 0;
const TEMPO_DIGIT_MAX = 60;
const TEMPO_DIGIT_LABEL_LETTER_SPACING = "0.06em";

const clampTempoDigit = (raw: string): number => {
  const parsed = Number.parseInt(raw, 10);

  if (Number.isNaN(parsed)) {
    return TEMPO_DIGIT_MIN;
  }

  if (parsed < TEMPO_DIGIT_MIN) {
    return TEMPO_DIGIT_MIN;
  }

  if (parsed > TEMPO_DIGIT_MAX) {
    return TEMPO_DIGIT_MAX;
  }

  return parsed;
};

type TempoDigitProps = {
  value: number;
  onChange: (next: number) => void;
  label: string;
  disabled?: boolean;
};

export const TempoDigit = ({ value, onChange, label, disabled = false }: TempoDigitProps) => (
  <Stack spacing={0.5} sx={{ alignItems: "center" }}>
    <TextField
      type="number"
      size="small"
      value={value}
      onChange={(e) => onChange(clampTempoDigit(e.target.value))}
      inputProps={{
        min: TEMPO_DIGIT_MIN,
        max: TEMPO_DIGIT_MAX,
        step: 1,
        style: { textAlign: "center" },
      }}
      disabled={disabled}
      sx={{ width: TEMPO_DIGIT_WIDTH_PX }}
    />

    <Typography
      variant="overline"
      sx={{ letterSpacing: TEMPO_DIGIT_LABEL_LETTER_SPACING, color: "text.subtle" }}
    >
      {label}
    </Typography>
  </Stack>
);

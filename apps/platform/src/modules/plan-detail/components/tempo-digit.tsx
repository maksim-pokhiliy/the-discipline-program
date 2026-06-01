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

const EXPLOSIVE_TOKEN = "X";

type TempoDigitProps = {
  value: number;
  onChange: (next: number) => void;
  label: string;
  allowX?: boolean;
  disabled?: boolean;
};

export const TempoDigit = ({
  value,
  onChange,
  label,
  allowX = false,
  disabled = false,
}: TempoDigitProps) => {
  const displayValue = allowX && value === 0 ? EXPLOSIVE_TOKEN : String(value);

  const handleChange = (raw: string): void => {
    if (allowX && (raw === EXPLOSIVE_TOKEN || raw === EXPLOSIVE_TOKEN.toLowerCase())) {
      onChange(0);

      return;
    }

    onChange(clampTempoDigit(raw));
  };

  return (
    <Stack spacing={0.5} sx={{ alignItems: "center" }}>
      <TextField
        type="text"
        size="small"
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        inputProps={{ inputMode: "numeric", style: { textAlign: "center" } }}
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
};

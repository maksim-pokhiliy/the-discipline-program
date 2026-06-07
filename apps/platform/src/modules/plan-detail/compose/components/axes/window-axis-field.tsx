"use client";

import { Stack, TextField, Typography } from "@mui/material";

import { fieldErrorsFor } from "../../lib/axis-field-errors";

const FIELD_WIDTH = 96;
const EN_DASH = "–";
const START_LABEL = "Start HH:MM";
const END_LABEL = "End HH:MM";

type WindowAxisValue = { startHhMm: string; endHhMm: string };

type WindowAxisFieldProps = {
  value: WindowAxisValue;
  onChange: (next: WindowAxisValue) => void;
  disabled?: boolean;
};

export const WindowAxisField: React.FC<WindowAxisFieldProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const errors = fieldErrorsFor({ kind: "window", ...value });

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
      <TextField
        label={START_LABEL}
        size="small"
        value={value.startHhMm}
        onChange={(event) => onChange({ ...value, startHhMm: event.target.value })}
        error={errors.get("startHhMm") !== undefined}
        helperText={errors.get("startHhMm")}
        disabled={disabled}
        sx={{ maxWidth: FIELD_WIDTH }}
      />

      <Typography variant="body2" color="text.subtle">
        {EN_DASH}
      </Typography>

      <TextField
        label={END_LABEL}
        size="small"
        value={value.endHhMm}
        onChange={(event) => onChange({ ...value, endHhMm: event.target.value })}
        error={errors.get("endHhMm") !== undefined}
        helperText={errors.get("endHhMm")}
        disabled={disabled}
        sx={{ maxWidth: FIELD_WIDTH }}
      />
    </Stack>
  );
};

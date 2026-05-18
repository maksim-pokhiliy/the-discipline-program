"use client";

import { Box, FormControlLabel, Stack, Switch, TextField } from "@mui/material";

import type { RpeIntensity } from "@repo/contracts/lms/_shared";

type RpeFieldProps = {
  value: RpeIntensity | undefined;
  onChange: (next: RpeIntensity | undefined) => void;
  disabled?: boolean;
};

export const RpeField = ({ value, onChange, disabled = false }: RpeFieldProps) => {
  const enabled = value !== undefined;

  const handleToggle = (_: unknown, next: boolean) => {
    if (next) {
      onChange({ value: 7 });
    } else {
      onChange(undefined);
    }
  };

  return (
    <Box>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={handleToggle} disabled={disabled} />}
        label="RPE"
      />

      {enabled && value !== undefined && (
        <Stack sx={{ pl: 4, pt: 1 }}>
          <TextField
            label="RPE (1-10)"
            type="number"
            size="small"
            value={value.value}
            onChange={(e) => onChange({ value: Number(e.target.value) })}
            inputProps={{ min: 1, max: 10, step: 0.5 }}
            disabled={disabled}
            sx={{ maxWidth: 160 }}
          />
        </Stack>
      )}
    </Box>
  );
};

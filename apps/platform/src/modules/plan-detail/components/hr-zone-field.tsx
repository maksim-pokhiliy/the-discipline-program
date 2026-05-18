"use client";

import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
} from "@mui/material";

import { HR_ZONES, type HrZoneIntensity } from "@repo/contracts/lms/_shared";

type HrZoneFieldProps = {
  value: HrZoneIntensity | undefined;
  onChange: (next: HrZoneIntensity | undefined) => void;
  disabled?: boolean;
};

export const HrZoneField = ({ value, onChange, disabled = false }: HrZoneFieldProps) => {
  const enabled = value !== undefined;

  const handleToggle = (_: unknown, next: boolean) => {
    if (next) {
      onChange({ zone: "Z2" });
    } else {
      onChange(undefined);
    }
  };

  return (
    <Box>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={handleToggle} disabled={disabled} />}
        label="HR Zone"
      />

      {enabled && value !== undefined && (
        <Stack sx={{ pl: 4, pt: 1 }}>
          <FormControl size="small" sx={{ maxWidth: 160 }} disabled={disabled}>
            <InputLabel>Zone</InputLabel>
            <Select
              value={value.zone}
              label="Zone"
              onChange={(e) => onChange({ zone: e.target.value as (typeof HR_ZONES)[number] })}
            >
              {HR_ZONES.map((z) => (
                <MenuItem key={z} value={z}>
                  {z}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      )}
    </Box>
  );
};

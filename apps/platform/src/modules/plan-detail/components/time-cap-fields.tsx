"use client";

import {
  Button,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import { TIME_CAP_UNITS, type TimeCap, type TimeCapUnit } from "@repo/contracts/lms/_shared";

const TIME_CAP_PRESETS_MIN = [8, 10, 12, 15, 20, 25] as const;
const TIME_CAP_FIELD_WIDTH = 80;
const PRESET_SUFFIX = ":00";
const EN_DASH = "–";

type TimeCapFieldsProps = {
  value: TimeCap | null;
  onChange: (next: TimeCap | null) => void;
  error?: FieldErrors<TimeCap> | undefined;
  disabled?: boolean;
};

export const TimeCapFields = ({ value, onChange, error, disabled = false }: TimeCapFieldsProps) => {
  const activePreset =
    value !== null &&
    value.unit === "min" &&
    value.max === undefined &&
    TIME_CAP_PRESETS_MIN.some((n) => n === value.min)
      ? value.min
      : null;

  const handleMinChange = (raw: string) => {
    if (raw === "") {
      onChange(null);

      return;
    }

    onChange({ ...(value ?? { unit: "min" }), min: Number.parseInt(raw, 10) || 0 });
  };

  const handleMaxChange = (raw: string) => {
    onChange({
      ...(value ?? { min: 0, unit: "min" }),
      max: raw === "" ? undefined : Number.parseInt(raw, 10) || 0,
    });
  };

  const handleUnitChange = (_: unknown, unit: TimeCapUnit | null) => {
    if (unit === null) {
      return;
    }

    onChange({ ...(value ?? { min: 0 }), unit });
  };

  const handlePresetChange = (_: unknown, preset: number | null) => {
    if (preset !== null) {
      onChange({ min: preset, unit: "min" });
    }
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          type="number"
          size="small"
          placeholder="—"
          value={value?.min ?? ""}
          onChange={(e) => handleMinChange(e.target.value)}
          inputProps={{ min: 1, step: 1 }}
          error={error?.min !== undefined}
          helperText={error?.min?.message}
          disabled={disabled}
          sx={{ maxWidth: TIME_CAP_FIELD_WIDTH }}
        />

        <Typography variant="body2" color="text.subtle">
          {EN_DASH}
        </Typography>

        <TextField
          type="number"
          size="small"
          placeholder="max"
          value={value?.max ?? ""}
          onChange={(e) => handleMaxChange(e.target.value)}
          inputProps={{ min: 1, step: 1 }}
          error={error?.max !== undefined || error?.root !== undefined}
          helperText={error?.max?.message ?? error?.root?.message}
          disabled={disabled}
          sx={{ maxWidth: TIME_CAP_FIELD_WIDTH }}
        />

        <ToggleButtonGroup
          exclusive
          size="small"
          value={value?.unit ?? "min"}
          onChange={handleUnitChange}
          disabled={disabled}
        >
          {TIME_CAP_UNITS.map((u) => (
            <ToggleButton key={u} value={u}>
              {u}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={activePreset}
          onChange={handlePresetChange}
          disabled={disabled}
        >
          {TIME_CAP_PRESETS_MIN.map((n) => (
            <ToggleButton key={n} value={n}>
              {`${n}${PRESET_SUFFIX}`}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Button size="tiny" variant="text" onClick={() => onChange(null)} disabled={disabled}>
          clear
        </Button>
      </Stack>
    </Stack>
  );
};

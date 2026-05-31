"use client";

import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import {
  WEIGHT_COMPOUND_DEVICE_EQUIPMENT,
  type Weight,
  type WeightCompoundDeviceEquipment,
} from "@repo/contracts/lms/_shared";

type CompoundDeviceWeight = Extract<Weight, { variant: "compound_device" }>;

const COMPOUND_DEVICE_COUNTS = [1, 2] as const;

const EQUIPMENT_LABELS: Record<WeightCompoundDeviceEquipment, string> = {
  BODYWEIGHT: "Bodyweight",
  DUMBBELL: "Dumbbell",
  KETTLEBELL: "Kettlebell",
  BARBELL: "Barbell",
  BAND: "Band",
  PARALLEL_BARS: "Parallel bars",
  RINGS: "Rings",
  BOX: "Box",
  SOFA: "Sofa",
  BOX_OR_SOFA: "Box or sofa",
  MIXED: "Mixed",
  UNKNOWN: "Unknown",
};

type WeightCompoundDeviceFieldsProps = {
  value: CompoundDeviceWeight;
  onChange: (next: CompoundDeviceWeight) => void;
  error?: FieldErrors<CompoundDeviceWeight> | undefined;
  disabled?: boolean;
};

export const WeightCompoundDeviceFields = ({
  value,
  onChange,
  error,
  disabled = false,
}: WeightCompoundDeviceFieldsProps) => {
  const handleCountChange = (_: unknown, next: 1 | 2 | null) => {
    if (next === null) {
      return;
    }

    onChange({ ...value, count: next });
  };

  return (
    <Stack spacing={1.5}>
      <FormControl
        size="small"
        sx={{ minWidth: 200 }}
        disabled={disabled}
        error={error?.equipment !== undefined}
      >
        <InputLabel>Equipment</InputLabel>
        <Select
          value={value.equipment}
          label="Equipment"
          onChange={(e) =>
            onChange({ ...value, equipment: e.target.value as WeightCompoundDeviceEquipment })
          }
        >
          {WEIGHT_COMPOUND_DEVICE_EQUIPMENT.map((item) => (
            <MenuItem key={item} value={item}>
              {EQUIPMENT_LABELS[item]}
            </MenuItem>
          ))}
        </Select>
        {error?.equipment !== undefined && (
          <FormHelperText>{error.equipment.message}</FormHelperText>
        )}
      </FormControl>

      <ToggleButtonGroup
        aria-label="device count"
        value={value.count}
        exclusive
        onChange={handleCountChange}
        size="small"
        disabled={disabled}
      >
        {COMPOUND_DEVICE_COUNTS.map((count) => (
          <ToggleButton key={count} value={count}>
            {count}×
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <TextField
        label="Weight (kg)"
        type="number"
        size="small"
        value={typeof value.valueKg === "number" ? value.valueKg : ""}
        onChange={(e) => onChange({ ...value, valueKg: Number(e.target.value) })}
        inputProps={{ min: 0, step: 0.5 }}
        error={error?.valueKg !== undefined}
        helperText={error?.valueKg?.message}
        disabled={disabled}
        sx={{ maxWidth: 160 }}
      />
    </Stack>
  );
};

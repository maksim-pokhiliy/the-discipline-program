"use client";

import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import {
  WEIGHT_ASYMMETRIC_PASSIVE_EQUIPMENT,
  WEIGHT_PASSIVE_ARM_ACTIONS,
  WEIGHT_WORKING_ARMS,
  type Weight,
  type WeightAsymmetricPassiveEquipment,
  type WeightPassiveArmAction,
  type WeightWorkingArm,
} from "@repo/contracts/lms/_shared";

import { DEFAULT_VALUE_KG } from "./weight-load-defaults";

type AsymmetricArmWeight = Extract<Weight, { variant: "with_asymmetric_arm" }>;

const WORKING_ARM_LABELS: Record<WeightWorkingArm, string> = {
  left: "Left arm",
  right: "Right arm",
};

const PASSIVE_ARM_ACTION_LABELS: Record<WeightPassiveArmAction, string> = {
  hold_in_up: "Hold in up",
  hold_static: "Hold static",
  hold_with_extra_weight: "Hold with extra weight",
};

const PASSIVE_EQUIPMENT_LABELS: Record<WeightAsymmetricPassiveEquipment, string> = {
  DUMBBELL: "Dumbbell",
  KETTLEBELL: "Kettlebell",
};

type WeightAsymmetricArmFieldsProps = {
  value: AsymmetricArmWeight;
  onChange: (next: AsymmetricArmWeight) => void;
  error?: FieldErrors<AsymmetricArmWeight> | undefined;
  disabled?: boolean;
};

export const WeightAsymmetricArmFields = ({
  value,
  onChange,
  error,
  disabled = false,
}: WeightAsymmetricArmFieldsProps) => {
  const hasPassiveExtraWeight = value.passiveExtraWeight !== undefined;
  const passiveError = error?.passiveExtraWeight;

  const handlePassiveToggle = (_: unknown, next: boolean) => {
    if (next) {
      onChange({
        ...value,
        passiveExtraWeight: { equipment: "DUMBBELL", valueKg: DEFAULT_VALUE_KG },
      });

      return;
    }

    onChange({
      variant: "with_asymmetric_arm",
      valueKg: value.valueKg,
      workingArm: value.workingArm,
      passiveArmAction: value.passiveArmAction,
    });
  };

  return (
    <Stack spacing={1.5}>
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

      <FormControl
        size="small"
        sx={{ minWidth: 160 }}
        disabled={disabled}
        error={error?.workingArm !== undefined}
      >
        <InputLabel>Working arm</InputLabel>
        <Select
          value={value.workingArm}
          label="Working arm"
          onChange={(e) => onChange({ ...value, workingArm: e.target.value as WeightWorkingArm })}
        >
          {WEIGHT_WORKING_ARMS.map((arm) => (
            <MenuItem key={arm} value={arm}>
              {WORKING_ARM_LABELS[arm]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl
        size="small"
        sx={{ minWidth: 220 }}
        disabled={disabled}
        error={error?.passiveArmAction !== undefined}
      >
        <InputLabel>Passive arm action</InputLabel>
        <Select
          value={value.passiveArmAction}
          label="Passive arm action"
          onChange={(e) =>
            onChange({ ...value, passiveArmAction: e.target.value as WeightPassiveArmAction })
          }
        >
          {WEIGHT_PASSIVE_ARM_ACTIONS.map((action) => (
            <MenuItem key={action} value={action}>
              {PASSIVE_ARM_ACTION_LABELS[action]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={hasPassiveExtraWeight}
              onChange={handlePassiveToggle}
              disabled={disabled}
            />
          }
          label="Passive arm extra weight"
        />

        {value.passiveExtraWeight !== undefined && (
          <Stack spacing={1.5} sx={{ pl: 4, pt: 1 }}>
            <FormControl
              size="small"
              sx={{ minWidth: 160 }}
              disabled={disabled}
              error={passiveError?.equipment !== undefined}
            >
              <InputLabel>Equipment</InputLabel>
              <Select
                value={value.passiveExtraWeight.equipment}
                label="Equipment"
                onChange={(e) =>
                  onChange({
                    ...value,
                    passiveExtraWeight: {
                      equipment: e.target.value as WeightAsymmetricPassiveEquipment,
                      valueKg: value.passiveExtraWeight?.valueKg ?? DEFAULT_VALUE_KG,
                    },
                  })
                }
              >
                {WEIGHT_ASYMMETRIC_PASSIVE_EQUIPMENT.map((item) => (
                  <MenuItem key={item} value={item}>
                    {PASSIVE_EQUIPMENT_LABELS[item]}
                  </MenuItem>
                ))}
              </Select>
              {passiveError?.equipment !== undefined && (
                <FormHelperText>{passiveError.equipment.message}</FormHelperText>
              )}
            </FormControl>

            <TextField
              label="Extra weight (kg)"
              type="number"
              size="small"
              value={
                typeof value.passiveExtraWeight.valueKg === "number"
                  ? value.passiveExtraWeight.valueKg
                  : ""
              }
              onChange={(e) =>
                onChange({
                  ...value,
                  passiveExtraWeight: {
                    equipment: value.passiveExtraWeight?.equipment ?? "DUMBBELL",
                    valueKg: Number(e.target.value),
                  },
                })
              }
              inputProps={{ min: 0, step: 0.5 }}
              error={passiveError?.valueKg !== undefined}
              helperText={passiveError?.valueKg?.message}
              disabled={disabled}
              sx={{ maxWidth: 160 }}
            />
          </Stack>
        )}
      </Box>
    </Stack>
  );
};

"use client";

import {
  Box,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  Typography,
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
import { LabeledToggleGroup } from "@repo/ui";

import { DEFAULT_VALUE_KG } from "./weight-load-defaults";

type AsymmetricArmWeight = Extract<Weight, { variant: "with_asymmetric_arm" }>;

const WORKING_ARM_LABELS: Record<WeightWorkingArm, string> = {
  left: "L",
  right: "R",
};

const PASSIVE_ARM_ACTION_LABELS: Record<WeightPassiveArmAction, string> = {
  hold_in_up: "hold up",
  hold_static: "static",
  hold_with_extra_weight: "extra wt",
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

  const handleWorkingArmChange = (_: unknown, next: WeightWorkingArm | null) => {
    if (next === null) {
      return;
    }

    onChange({ ...value, workingArm: next });
  };

  const handlePassiveActionChange = (_: unknown, next: WeightPassiveArmAction | null) => {
    if (next === null) {
      return;
    }

    onChange({ ...value, passiveArmAction: next });
  };

  const handlePassiveEquipmentChange = (
    _: unknown,
    next: WeightAsymmetricPassiveEquipment | null,
  ) => {
    if (next === null) {
      return;
    }

    onChange({
      ...value,
      passiveExtraWeight: {
        equipment: next,
        valueKg: value.passiveExtraWeight?.valueKg ?? DEFAULT_VALUE_KG,
      },
    });
  };

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

      <LabeledToggleGroup
        label="working arm"
        value={value.workingArm}
        onChange={handleWorkingArmChange}
        disabled={disabled}
      >
        {WEIGHT_WORKING_ARMS.map((arm) => (
          <ToggleButton key={arm} value={arm}>
            {WORKING_ARM_LABELS[arm]}
          </ToggleButton>
        ))}
      </LabeledToggleGroup>

      <LabeledToggleGroup
        label="passive arm"
        value={value.passiveArmAction}
        onChange={handlePassiveActionChange}
        disabled={disabled}
      >
        {WEIGHT_PASSIVE_ARM_ACTIONS.map((action) => (
          <ToggleButton key={action} value={action}>
            {PASSIVE_ARM_ACTION_LABELS[action]}
          </ToggleButton>
        ))}
      </LabeledToggleGroup>

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
            <LabeledToggleGroup
              label="equipment"
              value={value.passiveExtraWeight.equipment}
              onChange={handlePassiveEquipmentChange}
              disabled={disabled}
              helper={
                passiveError?.equipment !== undefined ? (
                  <Typography variant="caption" color="error">
                    {passiveError.equipment.message}
                  </Typography>
                ) : undefined
              }
            >
              {WEIGHT_ASYMMETRIC_PASSIVE_EQUIPMENT.map((item) => (
                <ToggleButton key={item} value={item}>
                  {PASSIVE_EQUIPMENT_LABELS[item]}
                </ToggleButton>
              ))}
            </LabeledToggleGroup>

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

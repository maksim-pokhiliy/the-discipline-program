"use client";

import { DeleteOutline as DeleteOutlineIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import {
  WEIGHT_SPLIT_TIER_EQUIPMENT,
  type Weight,
  type WeightSplitTierEquipment,
} from "@repo/contracts/lms/_shared";

import { DEFAULT_VALUE_KG } from "./weight-load-defaults";

type SplitTierWeight = Extract<Weight, { variant: "split_tier" }>;
type SplitTierStage = SplitTierWeight["stages"][number];

const MIN_STAGES = 2;
const DEFAULT_STAGE_REPS = 5;

const EQUIPMENT_LABELS: Record<WeightSplitTierEquipment, string> = {
  DUMBBELL: "Dumbbell",
  KETTLEBELL: "Kettlebell",
  BARBELL: "Barbell",
  MIXED: "Mixed",
};

const buildStage = (): SplitTierStage => ({
  reps: DEFAULT_STAGE_REPS,
  equipment: "DUMBBELL",
  valueKg: DEFAULT_VALUE_KG,
});

type WeightSplitTierFieldsProps = {
  value: SplitTierWeight;
  onChange: (next: SplitTierWeight) => void;
  error?: FieldErrors<SplitTierWeight> | undefined;
  disabled?: boolean;
};

export const WeightSplitTierFields = ({
  value,
  onChange,
  error,
  disabled = false,
}: WeightSplitTierFieldsProps) => {
  const canRemove = value.stages.length > MIN_STAGES;

  const updateStage = (index: number, next: SplitTierStage) => {
    onChange({
      ...value,
      stages: value.stages.map((stage, i) => (i === index ? next : stage)),
    });
  };

  const removeStage = (index: number) => {
    onChange({ ...value, stages: value.stages.filter((_, i) => i !== index) });
  };

  const addStage = () => {
    onChange({ ...value, stages: [...value.stages, buildStage()] });
  };

  return (
    <Stack spacing={1.5}>
      {value.stages.map((stage, index) => {
        const stageError = error?.stages?.[index];

        return (
          <Stack
            key={index}
            direction="row"
            spacing={1}
            sx={{ alignItems: "flex-start", flexWrap: "wrap" }}
          >
            <TextField
              label="Reps"
              type="number"
              size="small"
              value={typeof stage.reps === "number" ? stage.reps : ""}
              onChange={(e) => updateStage(index, { ...stage, reps: Number(e.target.value) })}
              inputProps={{ min: 1, step: 1 }}
              error={stageError?.reps !== undefined}
              helperText={stageError?.reps?.message}
              disabled={disabled}
              sx={{ maxWidth: 100 }}
            />

            <FormControl
              size="small"
              sx={{ minWidth: 160 }}
              disabled={disabled}
              error={stageError?.equipment !== undefined}
            >
              <InputLabel>Equipment</InputLabel>
              <Select
                value={stage.equipment}
                label="Equipment"
                onChange={(e) =>
                  updateStage(index, {
                    ...stage,
                    equipment: e.target.value as WeightSplitTierEquipment,
                  })
                }
              >
                {WEIGHT_SPLIT_TIER_EQUIPMENT.map((item) => (
                  <MenuItem key={item} value={item}>
                    {EQUIPMENT_LABELS[item]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Weight (kg)"
              type="number"
              size="small"
              value={typeof stage.valueKg === "number" ? stage.valueKg : ""}
              onChange={(e) => updateStage(index, { ...stage, valueKg: Number(e.target.value) })}
              inputProps={{ min: 0, step: 0.5 }}
              error={stageError?.valueKg !== undefined}
              helperText={stageError?.valueKg?.message}
              disabled={disabled}
              sx={{ maxWidth: 140 }}
            />

            <IconButton
              aria-label="Remove stage"
              size="small"
              onClick={() => removeStage(index)}
              disabled={disabled || !canRemove}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>
        );
      })}

      <Box>
        <Button size="small" variant="outlined" onClick={addStage} disabled={disabled}>
          Add stage
        </Button>
      </Box>
    </Stack>
  );
};

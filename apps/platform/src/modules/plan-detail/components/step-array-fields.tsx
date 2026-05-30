"use client";

import CloseIcon from "@mui/icons-material/Close";
import { Button, FormHelperText, IconButton, Stack, TextField } from "@mui/material";
import type { FieldError, FieldErrorsImpl, Merge } from "react-hook-form";

const MIN_STEPS = 1;
const MIN_STEP_VALUE = 0;
const FALLBACK_STEP = 0;
const CELL_MAX_WIDTH = 72;
const DECIMAL_RADIX = 10;

export const coerceStepValue = (raw: string): number => {
  const parsed = Number.parseInt(raw, DECIMAL_RADIX);

  return Number.isNaN(parsed) || parsed < MIN_STEP_VALUE ? MIN_STEP_VALUE : parsed;
};

type StepArrayFieldsError = Merge<FieldError, FieldErrorsImpl<number[]>>;

type StepArrayFieldsProps = {
  value: number[];
  onChange: (next: number[]) => void;
  error?: StepArrayFieldsError | undefined;
  disabled?: boolean;
};

export const StepArrayFields = ({
  value,
  onChange,
  error,
  disabled = false,
}: StepArrayFieldsProps) => {
  const canRemove = value.length > MIN_STEPS;

  const updateStep = (index: number, raw: string) => {
    onChange(value.map((step, i) => (i === index ? coerceStepValue(raw) : step)));
  };

  const removeStep = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addStep = () => {
    onChange([...value, value[value.length - 1] ?? FALLBACK_STEP]);
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        {value.map((step, index) => (
          <Stack key={index} direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <TextField
              type="number"
              size="small"
              aria-label={`Step ${index + 1}`}
              value={step}
              onChange={(e) => updateStep(index, e.target.value)}
              inputProps={{ min: MIN_STEP_VALUE, step: 1, "aria-label": `Step ${index + 1}` }}
              disabled={disabled}
              sx={{ maxWidth: CELL_MAX_WIDTH }}
            />

            <IconButton
              aria-label="Remove step"
              size="small"
              onClick={() => removeStep(index)}
              disabled={disabled || !canRemove}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        ))}

        <Button size="tiny" variant="text" onClick={addStep} disabled={disabled}>
          add step
        </Button>
      </Stack>

      {error !== undefined && (
        <FormHelperText error>{error.message ?? error.root?.message}</FormHelperText>
      )}
    </Stack>
  );
};

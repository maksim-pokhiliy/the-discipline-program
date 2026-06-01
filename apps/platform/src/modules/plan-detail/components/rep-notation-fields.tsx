"use client";

import { Button, Stack, TextField, ToggleButton, Typography } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import {
  MAX_SUB_FORMS,
  REP_UNITS,
  type MaxSubForm,
  type RepNotation,
  type RepUnit,
} from "@repo/contracts/lms/_shared";
import { LabeledToggleGroup } from "@repo/ui";

type CountReps = Extract<RepNotation, { kind: "count" }>;
type RangeReps = Extract<RepNotation, { kind: "range" }>;
type UnitBoundReps = Extract<RepNotation, { kind: "unit_bound" }>;
type TotalFlagReps = Extract<RepNotation, { kind: "total_flag" }>;

const UNIT_BOUND_DEFAULT_VALUE = 30;
const UNIT_BOUND_RANGE_DEFAULT_MIN = 30;
const UNIT_BOUND_RANGE_DEFAULT_MAX = 60;

const NUMERIC_FIELD_WIDTH = 80;
const RANGE_FIELD_WIDTH = 70;
const EN_DASH = "–";
const ROW_STACK_SX = { alignItems: "center", flexWrap: "wrap" } as const;
const PROGRESSIVE_SEED_PLACEHOLDER = "e.g. 3-3-3-2-2-1-1";
const IMPLICIT_HINT = "no reps written — defined by surrounding context (ladder marker, etc.)";
const COMPOUND_HINT = "a single rep is defined elsewhere via REP_DEFINITION row.";

const MAX_SUB_FORM_LABELS: Record<MaxSubForm, string> = {
  bare: "Bare",
  progressive: "Progressive",
  in_remaining_time: "In remaining time",
};

type RepNotationFieldsProps = {
  value: RepNotation;
  onChange: (next: RepNotation) => void;
  error?: FieldErrors<RepNotation> | undefined;
  disabled?: boolean;
};

export const RepNotationFields = ({
  value,
  onChange,
  error,
  disabled = false,
}: RepNotationFieldsProps) => {
  const rootMessage = error?.root?.message;

  const handleUnitChange = (_: unknown, next: RepUnit | null): void => {
    if (next === null || value.kind !== "unit_bound") {
      return;
    }

    onChange({ ...value, unit: next });
  };

  const handleSubFormChange = (_: unknown, next: MaxSubForm | null): void => {
    if (next === null || value.kind !== "max") {
      return;
    }

    onChange({ kind: "max", subForm: next });
  };

  switch (value.kind) {
    case "count": {
      const countError: FieldErrors<CountReps> | undefined = error;

      return (
        <Stack direction="row" spacing={1} sx={ROW_STACK_SX}>
          <TextField
            type="number"
            size="small"
            value={value.value}
            onChange={(e) => onChange({ kind: "count", value: Number(e.target.value) })}
            inputProps={{ min: 1, step: 1 }}
            error={countError?.value !== undefined}
            helperText={countError?.value?.message}
            disabled={disabled}
            sx={{ maxWidth: NUMERIC_FIELD_WIDTH }}
          />

          <Typography variant="caption" color="text.subtle">
            reps
          </Typography>
        </Stack>
      );
    }
    case "range": {
      const rangeError: FieldErrors<RangeReps> | undefined = error;

      return (
        <Stack direction="row" spacing={1} sx={ROW_STACK_SX}>
          <TextField
            type="number"
            size="small"
            value={value.min}
            onChange={(e) => onChange({ ...value, min: Number(e.target.value) })}
            inputProps={{ min: 1, step: 1 }}
            error={rangeError?.min !== undefined || rootMessage !== undefined}
            helperText={rangeError?.min?.message}
            disabled={disabled}
            sx={{ maxWidth: RANGE_FIELD_WIDTH }}
          />

          <Typography variant="body2" color="text.subtle">
            {EN_DASH}
          </Typography>

          <TextField
            type="number"
            size="small"
            value={value.max}
            onChange={(e) => onChange({ ...value, max: Number(e.target.value) })}
            inputProps={{ min: 1, step: 1 }}
            error={rangeError?.max !== undefined || rootMessage !== undefined}
            helperText={rangeError?.max?.message}
            disabled={disabled}
            sx={{ maxWidth: RANGE_FIELD_WIDTH }}
          />

          <Typography variant="caption" color="text.subtle">
            reps
          </Typography>
        </Stack>
      );
    }
    case "unit_bound": {
      const { unit, range } = value;
      const unitBoundError: FieldErrors<UnitBoundReps> | undefined = error;

      return (
        <Stack spacing={1}>
          <LabeledToggleGroup
            label="unit"
            value={unit}
            onChange={handleUnitChange}
            disabled={disabled}
          >
            {REP_UNITS.map((u) => (
              <ToggleButton key={u} value={u}>
                {u}
              </ToggleButton>
            ))}
          </LabeledToggleGroup>

          {range === undefined ? (
            <Stack direction="row" spacing={1} sx={ROW_STACK_SX}>
              <TextField
                type="number"
                size="small"
                value={value.value ?? ""}
                onChange={(e) =>
                  onChange({ kind: "unit_bound", unit, value: Number(e.target.value) })
                }
                inputProps={{ min: 1, step: 0.1 }}
                error={unitBoundError?.value !== undefined || rootMessage !== undefined}
                helperText={unitBoundError?.value?.message}
                disabled={disabled}
                sx={{ maxWidth: NUMERIC_FIELD_WIDTH }}
              />

              <Button
                size="tiny"
                variant="text"
                disabled={disabled}
                onClick={() =>
                  onChange({
                    kind: "unit_bound",
                    unit,
                    range: { min: UNIT_BOUND_RANGE_DEFAULT_MIN, max: UNIT_BOUND_RANGE_DEFAULT_MAX },
                  })
                }
              >
                range
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} sx={ROW_STACK_SX}>
              <TextField
                type="number"
                size="small"
                value={range.min}
                onChange={(e) =>
                  onChange({
                    kind: "unit_bound",
                    unit,
                    range: { min: Number(e.target.value), max: range.max },
                  })
                }
                inputProps={{ min: 1, step: 0.1 }}
                error={unitBoundError?.range?.min !== undefined || rootMessage !== undefined}
                helperText={unitBoundError?.range?.min?.message}
                disabled={disabled}
                sx={{ maxWidth: RANGE_FIELD_WIDTH }}
              />

              <Typography variant="body2" color="text.subtle">
                {EN_DASH}
              </Typography>

              <TextField
                type="number"
                size="small"
                value={range.max}
                onChange={(e) =>
                  onChange({
                    kind: "unit_bound",
                    unit,
                    range: { min: range.min, max: Number(e.target.value) },
                  })
                }
                inputProps={{ min: 1, step: 0.1 }}
                error={unitBoundError?.range?.max !== undefined || rootMessage !== undefined}
                helperText={unitBoundError?.range?.max?.message}
                disabled={disabled}
                sx={{ maxWidth: RANGE_FIELD_WIDTH }}
              />

              <Button
                size="tiny"
                variant="text"
                disabled={disabled}
                onClick={() =>
                  onChange({ kind: "unit_bound", unit, value: UNIT_BOUND_DEFAULT_VALUE })
                }
              >
                single
              </Button>
            </Stack>
          )}
        </Stack>
      );
    }
    case "max":
      return (
        <Stack spacing={1}>
          <LabeledToggleGroup
            label="form"
            value={value.subForm}
            onChange={handleSubFormChange}
            disabled={disabled}
          >
            {MAX_SUB_FORMS.map((subForm) => (
              <ToggleButton key={subForm} value={subForm}>
                {MAX_SUB_FORM_LABELS[subForm]}
              </ToggleButton>
            ))}
          </LabeledToggleGroup>

          {value.subForm === "progressive" && (
            <Stack direction="row" spacing={1} sx={ROW_STACK_SX}>
              <Typography variant="caption" color="text.subtle">
                seed
              </Typography>

              <TextField
                size="small"
                placeholder={PROGRESSIVE_SEED_PLACEHOLDER}
                value={value.progressiveSeed ?? ""}
                onChange={(e) =>
                  onChange({
                    kind: "max",
                    subForm: "progressive",
                    ...(e.target.value !== "" && { progressiveSeed: e.target.value }),
                  })
                }
                disabled={disabled}
              />
            </Stack>
          )}
        </Stack>
      );
    case "implicit":
      return (
        <Typography variant="caption" color="text.subtle">
          {IMPLICIT_HINT}
        </Typography>
      );
    case "total_flag": {
      const totalFlagError: FieldErrors<TotalFlagReps> | undefined = error;

      return (
        <Stack direction="row" spacing={1} sx={ROW_STACK_SX}>
          <Typography variant="caption" color="text.subtle">
            total
          </Typography>

          <TextField
            type="number"
            size="small"
            value={value.value}
            onChange={(e) => onChange({ kind: "total_flag", value: Number(e.target.value) })}
            inputProps={{ min: 1, step: 1 }}
            error={totalFlagError?.value !== undefined}
            helperText={totalFlagError?.value?.message}
            disabled={disabled}
            sx={{ maxWidth: NUMERIC_FIELD_WIDTH }}
          />
        </Stack>
      );
    }
    case "compound_rep_unit":
      return (
        <Typography variant="caption" color="text.subtle">
          {COMPOUND_HINT}
        </Typography>
      );
    default:
      value satisfies never;

      return null;
  }
};

"use client";

import { Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";

import { INTERVAL_DURATION_UNITS } from "@repo/contracts/lms/composition";

import { fieldErrorsFor } from "../../lib/axis-field-errors";
import { NumberField } from "../number-field";

import type { IntervalDuration } from "./axis-draft.types";

const WORK_VALUE_MIN = 0;
const OFF_VALUE_MIN = 0;
const COUNT_MIN = 1;
const COUNT_STEP = 1;
const FIELD_WIDTH = 110;
const WORK_LABEL = "Work";
const OFF_LABEL = "Off";
const COUNT_LABEL = "Count";

type IntervalDurationUnit = IntervalDuration["unit"];

type IntervalAxisValue = { work: IntervalDuration; off: IntervalDuration; count: number };

type IntervalAxisFieldProps = {
  value: IntervalAxisValue;
  onChange: (next: IntervalAxisValue) => void;
  disabled?: boolean;
};

export const IntervalAxisField: React.FC<IntervalAxisFieldProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const errors = fieldErrorsFor({ kind: "interval", ...value });

  const handleWorkUnit = (_: unknown, unit: IntervalDurationUnit | null): void => {
    if (unit === null) {
      return;
    }

    onChange({ ...value, work: { ...value.work, unit } });
  };

  const handleOffUnit = (_: unknown, unit: IntervalDurationUnit | null): void => {
    if (unit === null) {
      return;
    }

    onChange({ ...value, off: { ...value.off, unit } });
  };

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
      <NumberField
        label={WORK_LABEL}
        value={value.work.value}
        onChange={(next) => onChange({ ...value, work: { ...value.work, value: next } })}
        min={WORK_VALUE_MIN}
        error={errors.get("work")}
        disabled={disabled}
        maxWidth={FIELD_WIDTH}
      />

      <ToggleButtonGroup
        aria-label="interval work unit"
        exclusive
        size="small"
        value={value.work.unit}
        onChange={handleWorkUnit}
        disabled={disabled}
      >
        {INTERVAL_DURATION_UNITS.map((unit) => (
          <ToggleButton key={unit} value={unit}>
            {unit}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <NumberField
        label={OFF_LABEL}
        value={value.off.value}
        onChange={(next) => onChange({ ...value, off: { ...value.off, value: next } })}
        min={OFF_VALUE_MIN}
        error={errors.get("off")}
        disabled={disabled}
        maxWidth={FIELD_WIDTH}
      />

      <ToggleButtonGroup
        aria-label="interval off unit"
        exclusive
        size="small"
        value={value.off.unit}
        onChange={handleOffUnit}
        disabled={disabled}
      >
        {INTERVAL_DURATION_UNITS.map((unit) => (
          <ToggleButton key={unit} value={unit}>
            {unit}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <NumberField
        label={COUNT_LABEL}
        value={value.count}
        onChange={(count) => onChange({ ...value, count })}
        min={COUNT_MIN}
        step={COUNT_STEP}
        error={errors.get("count")}
        disabled={disabled}
        maxWidth={FIELD_WIDTH}
      />
    </Stack>
  );
};

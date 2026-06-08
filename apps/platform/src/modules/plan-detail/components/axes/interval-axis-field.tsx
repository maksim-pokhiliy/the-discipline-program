"use client";

import { Stack } from "@mui/material";

import { fieldErrorsFor } from "../../lib/axis-field-errors";
import { NumberField } from "../number-field";

const FIELD_MIN = 1;
const OFF_FIELD_MIN = 0;
const FIELD_STEP = 1;
const FIELD_WIDTH = 110;
const WORK_LABEL = "Work (min)";
const OFF_LABEL = "Off (min)";
const COUNT_LABEL = "Count";

type IntervalAxisValue = { workMin: number; offMin: number; count: number };

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

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
      <NumberField
        label={WORK_LABEL}
        value={value.workMin}
        onChange={(workMin) => onChange({ ...value, workMin })}
        min={FIELD_MIN}
        step={FIELD_STEP}
        error={errors.get("workMin")}
        disabled={disabled}
        maxWidth={FIELD_WIDTH}
      />

      <NumberField
        label={OFF_LABEL}
        value={value.offMin}
        onChange={(offMin) => onChange({ ...value, offMin })}
        min={OFF_FIELD_MIN}
        step={FIELD_STEP}
        error={errors.get("offMin")}
        disabled={disabled}
        maxWidth={FIELD_WIDTH}
      />

      <NumberField
        label={COUNT_LABEL}
        value={value.count}
        onChange={(count) => onChange({ ...value, count })}
        min={FIELD_MIN}
        step={FIELD_STEP}
        error={errors.get("count")}
        disabled={disabled}
        maxWidth={FIELD_WIDTH}
      />
    </Stack>
  );
};

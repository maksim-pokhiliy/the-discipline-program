"use client";

import { Stack } from "@mui/material";

import { NumberField } from "../../../components/number-field";

const FIELD_MIN = 1;
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
}) => (
  <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
    <NumberField
      label={WORK_LABEL}
      value={value.workMin}
      onChange={(workMin) => onChange({ ...value, workMin })}
      min={FIELD_MIN}
      step={FIELD_STEP}
      disabled={disabled}
      maxWidth={FIELD_WIDTH}
    />

    <NumberField
      label={OFF_LABEL}
      value={value.offMin}
      onChange={(offMin) => onChange({ ...value, offMin })}
      min={FIELD_MIN}
      step={FIELD_STEP}
      disabled={disabled}
      maxWidth={FIELD_WIDTH}
    />

    <NumberField
      label={COUNT_LABEL}
      value={value.count}
      onChange={(count) => onChange({ ...value, count })}
      min={FIELD_MIN}
      step={FIELD_STEP}
      disabled={disabled}
      maxWidth={FIELD_WIDTH}
    />
  </Stack>
);

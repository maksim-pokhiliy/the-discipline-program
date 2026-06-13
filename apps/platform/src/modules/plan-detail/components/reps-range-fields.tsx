"use client";

import { FormHelperText, Stack, Typography } from "@mui/material";

import { type RepNotation } from "@repo/contracts/lms/_shared";

import { NumberField } from "./number-field";

type RangeReps = Extract<RepNotation, { kind: "range" }>;

const EN_DASH = "–";
const FIELD_MIN = 1;
const FIELD_WIDTH = 90;
const RANGE_MIN_INVALID = "min must be less than max";

type RepsRangeFieldsProps = {
  value: RangeReps;
  onChange: (next: RangeReps) => void;
  disabled?: boolean;
};

export const RepsRangeFields = ({
  value,
  onChange,
  disabled = false,
}: RepsRangeFieldsProps): React.ReactElement => (
  <Stack spacing={0.5}>
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
      <NumberField
        label="Min"
        value={value.min}
        onChange={(min) => onChange({ kind: "range", min, max: value.max })}
        min={FIELD_MIN}
        disabled={disabled}
        maxWidth={FIELD_WIDTH}
      />

      <Typography variant="body2" color="text.subtle">
        {EN_DASH}
      </Typography>

      <NumberField
        label="Max"
        value={value.max}
        onChange={(max) => onChange({ kind: "range", min: value.min, max })}
        min={FIELD_MIN}
        disabled={disabled}
        maxWidth={FIELD_WIDTH}
      />
    </Stack>

    {value.min >= value.max && <FormHelperText error>{RANGE_MIN_INVALID}</FormHelperText>}
  </Stack>
);

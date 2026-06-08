"use client";

import { Stack } from "@mui/material";

import { fieldErrorsFor } from "../../lib/axis-field-errors";
import { NumberField } from "../number-field";

const FIELD_MIN = 1;
const FIELD_STEP = 1;
const FIELD_WIDTH = 110;
const EVERY_LABEL = "Every (min)";
const ROUNDS_LABEL = "Rounds";
const TOTAL_LABEL = "Total (min)";

type CadenceAxisValue = { everyMin: number; rounds: number; totalMin?: number };

type CadenceAxisFieldProps = {
  value: CadenceAxisValue;
  onChange: (next: CadenceAxisValue) => void;
  disabled?: boolean;
};

const withTotalMin = (value: CadenceAxisValue, totalMin: number): CadenceAxisValue =>
  Number.isFinite(totalMin) && totalMin >= FIELD_MIN
    ? { everyMin: value.everyMin, rounds: value.rounds, totalMin }
    : { everyMin: value.everyMin, rounds: value.rounds };

export const CadenceAxisField: React.FC<CadenceAxisFieldProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const errors = fieldErrorsFor({ kind: "cadence", ...value });

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
      <NumberField
        label={EVERY_LABEL}
        value={value.everyMin}
        onChange={(everyMin) => onChange({ ...value, everyMin })}
        min={FIELD_MIN}
        step={FIELD_STEP}
        error={errors.get("everyMin")}
        disabled={disabled}
        maxWidth={FIELD_WIDTH}
      />

      <NumberField
        label={ROUNDS_LABEL}
        value={value.rounds}
        onChange={(rounds) => onChange({ ...value, rounds })}
        min={FIELD_MIN}
        step={FIELD_STEP}
        error={errors.get("rounds")}
        disabled={disabled}
        maxWidth={FIELD_WIDTH}
      />

      <NumberField
        label={TOTAL_LABEL}
        value={value.totalMin ?? Number.NaN}
        onChange={(totalMin) => onChange(withTotalMin(value, totalMin))}
        min={FIELD_MIN}
        step={FIELD_STEP}
        error={errors.get("totalMin")}
        disabled={disabled}
        maxWidth={FIELD_WIDTH}
      />
    </Stack>
  );
};

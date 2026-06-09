"use client";

import { Stack } from "@mui/material";

import { fieldErrorsFor } from "../../lib/axis-field-errors";
import { NumberField } from "../number-field";

const FIELD_MIN = 1;
const FIELD_STEP = 1;
const FIELD_WIDTH = 110;
const EVERY_LABEL = "Every (min)";
const ROUNDS_LABEL = "Rounds";

type CadenceAxisValue = { everyMin: number; rounds: number };

type CadenceAxisFieldProps = {
  value: CadenceAxisValue;
  onChange: (next: CadenceAxisValue) => void;
  disabled?: boolean;
};

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
    </Stack>
  );
};

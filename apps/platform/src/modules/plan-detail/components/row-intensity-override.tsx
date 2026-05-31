"use client";

import { Button, Stack } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import { EffortPercentField } from "./effort-percent-field";
import { HrZoneField } from "./hr-zone-field";
import { NumericPaceField } from "./numeric-pace-field";
import { PaceField } from "./pace-field";
import { RpeField } from "./rpe-field";
import type { ShellIntensityForm } from "./schema-form-utils";

const ADD_OVERRIDE_LABEL = "+ add intensity override";
const REMOVE_OVERRIDE_LABEL = "remove override";

type RowIntensityOverrideProps = {
  value: ShellIntensityForm | null;
  onChange: (next: ShellIntensityForm | null) => void;
  error?: FieldErrors<ShellIntensityForm> | undefined;
  disabled?: boolean;
};

export const RowIntensityOverride = ({
  value,
  onChange,
  error,
  disabled = false,
}: RowIntensityOverrideProps) => {
  if (value === null) {
    return (
      <Button size="tiny" variant="outlined" disabled={disabled} onClick={() => onChange({})}>
        {ADD_OVERRIDE_LABEL}
      </Button>
    );
  }

  return (
    <Stack spacing={1.5}>
      <EffortPercentField
        value={value.effortPercent}
        onChange={(next) => onChange({ ...value, effortPercent: next })}
        error={error?.effortPercent}
        disabled={disabled}
      />

      <RpeField
        value={value.rpe}
        onChange={(next) => onChange({ ...value, rpe: next })}
        disabled={disabled}
      />

      <PaceField
        value={value.pace}
        onChange={(next) => onChange({ ...value, pace: next })}
        disabled={disabled}
      />

      <HrZoneField
        value={value.hrZone}
        onChange={(next) => onChange({ ...value, hrZone: next })}
        disabled={disabled}
      />

      <NumericPaceField
        value={value.numericPace}
        onChange={(next) => onChange({ ...value, numericPace: next })}
        error={error?.numericPace}
        disabled={disabled}
      />

      <Button
        size="tiny"
        variant="text"
        disabled={disabled}
        onClick={() => onChange(null)}
        sx={{ alignSelf: "flex-start" }}
      >
        {REMOVE_OVERRIDE_LABEL}
      </Button>
    </Stack>
  );
};

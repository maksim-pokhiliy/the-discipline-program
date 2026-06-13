"use client";

import { Stack, ToggleButton } from "@mui/material";

import { REP_UNITS, type RepNotation, type RepUnit } from "@repo/contracts/lms/_shared";
import { LabeledToggleGroup } from "@repo/ui";

import { CountOrRange, type CountOrRangeValue } from "./count-or-range-field";

type UnitBoundReps = Extract<RepNotation, { kind: "unit_bound" }>;

const DEFAULT_VALUE = 1;

const UNIT_LABELS: Record<RepUnit, string> = {
  sec: "sec",
  min: "min",
  km: "km",
};

const toCountOrRange = (value: UnitBoundReps): CountOrRangeValue =>
  value.range !== undefined ? value.range : (value.value ?? DEFAULT_VALUE);

type RepsUnitBoundFieldsProps = {
  value: UnitBoundReps;
  onChange: (next: UnitBoundReps) => void;
  disabled?: boolean;
};

export const RepsUnitBoundFields = ({
  value,
  onChange,
  disabled = false,
}: RepsUnitBoundFieldsProps): React.ReactElement => {
  const handleUnitChange = (_: unknown, unit: RepUnit | null): void => {
    if (unit === null) {
      return;
    }

    onChange({ ...value, unit });
  };

  const handleBodyChange = (next: CountOrRangeValue): void => {
    onChange(
      typeof next === "object"
        ? { kind: "unit_bound", unit: value.unit, range: next }
        : { kind: "unit_bound", unit: value.unit, value: next },
    );
  };

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
      <LabeledToggleGroup
        label="unit"
        value={value.unit}
        onChange={handleUnitChange}
        disabled={disabled}
      >
        {REP_UNITS.map((unit) => (
          <ToggleButton key={unit} value={unit}>
            {UNIT_LABELS[unit]}
          </ToggleButton>
        ))}
      </LabeledToggleGroup>

      <CountOrRange value={toCountOrRange(value)} onChange={handleBodyChange} disabled={disabled} />
    </Stack>
  );
};

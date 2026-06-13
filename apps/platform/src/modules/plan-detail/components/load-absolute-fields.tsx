"use client";

import { Stack, ToggleButton } from "@mui/material";

import { type Load } from "@repo/contracts/lms/_shared";
import { LabeledToggleGroup } from "@repo/ui";

import { NumberField } from "./number-field";

type AbsoluteLoad = Extract<Load, { kind: "absolute" }>;

const KG_FIELD_MIN = 0;
const KG_FIELD_STEP = 0.5;
const KG_FIELD_WIDTH = 110;

const COUNT_LABELS: Record<AbsoluteLoad["count"], string> = {
  1: "1×",
  2: "2×",
};

const COUNT_OPTIONS: readonly AbsoluteLoad["count"][] = [1, 2];

type LoadAbsoluteFieldsProps = {
  value: AbsoluteLoad;
  onChange: (next: AbsoluteLoad) => void;
  disabled?: boolean;
};

export const LoadAbsoluteFields = ({
  value,
  onChange,
  disabled = false,
}: LoadAbsoluteFieldsProps): React.ReactElement => {
  const handleCountChange = (_: unknown, count: AbsoluteLoad["count"] | null): void => {
    if (count === null) {
      return;
    }

    onChange({ ...value, count });
  };

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
      <LabeledToggleGroup
        label="count"
        value={value.count}
        onChange={handleCountChange}
        disabled={disabled}
      >
        {COUNT_OPTIONS.map((count) => (
          <ToggleButton key={count} value={count}>
            {COUNT_LABELS[count]}
          </ToggleButton>
        ))}
      </LabeledToggleGroup>

      <NumberField
        label="Weight (kg)"
        value={value.kg}
        onChange={(kg) => onChange({ ...value, kg })}
        min={KG_FIELD_MIN}
        step={KG_FIELD_STEP}
        disabled={disabled}
        maxWidth={KG_FIELD_WIDTH}
      />
    </Stack>
  );
};

import { type ReactElement } from "react";

import { Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";

import { DISTANCE_UNITS } from "@repo/contracts/lms/_shared";

import {
  DISTANCE_FIELD_LABEL,
  DISTANCE_UNIT_LABELS,
  RESULT_UNIT_GROUP_GAP_PX,
} from "../../utils/athlete-session.constants";
import {
  DISTANCE_UNIT_KEY,
  DISTANCE_VALUE_KEY,
  type ResultFieldsProps,
} from "../../utils/result-form-config";

import { ResultNumberField } from "./result-number-field";

const DEFAULT_UNIT = DISTANCE_UNITS[0];

export const DistanceFields = ({ draft, onChange }: ResultFieldsProps): ReactElement => {
  const selectedUnit = draft[DISTANCE_UNIT_KEY] ?? DEFAULT_UNIT;

  return (
    <Stack direction="row" spacing={`${RESULT_UNIT_GROUP_GAP_PX}px`} alignItems="center">
      <ResultNumberField
        fieldKey={DISTANCE_VALUE_KEY}
        label={DISTANCE_FIELD_LABEL}
        draft={draft}
        onChange={onChange}
      />
      <ToggleButtonGroup
        exclusive
        size="small"
        value={selectedUnit}
        onChange={(_event, value: string | null) => {
          if (value !== null) {
            onChange(DISTANCE_UNIT_KEY, value);
          }
        }}
      >
        {DISTANCE_UNITS.map((unit) => (
          <ToggleButton key={unit} value={unit}>
            {DISTANCE_UNIT_LABELS[unit]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
};

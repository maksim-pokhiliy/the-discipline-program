"use client";

import { Button, FormHelperText, Stack, ToggleButton, Typography } from "@mui/material";

import {
  type Load,
  PERCENTAGE_REFERENCE_SCOPES,
  type PercentageReferenceScope,
} from "@repo/contracts/lms/_shared";
import { LabeledToggleGroup } from "@repo/ui";

import { ExercisePicker } from "./exercise-picker";
import { NumberField } from "./number-field";

type PercentageLoad = Extract<Load, { kind: "percentage" }>;

const PERCENT_MIN = 0;
const PERCENT_FIELD_WIDTH = 100;
const RANGE_MAX_OFFSET = 5;
const EMPTY_TARGET = "";
const EN_DASH = "–";
const ADD_RANGE_LABEL = "add range";
const REMOVE_RANGE_LABEL = "remove range";
const RANGE_MAX_INVALID = "Max% must be greater than %";

const SCOPE_LABELS: Record<PercentageReferenceScope, string> = {
  self: "This exercise",
  other_exercise: "Other exercise",
};

type LoadPercentageFieldsProps = {
  value: PercentageLoad;
  onChange: (next: PercentageLoad) => void;
  disabled?: boolean;
};

export const LoadPercentageFields = ({
  value,
  onChange,
  disabled = false,
}: LoadPercentageFieldsProps): React.ReactElement => {
  const hasRange = value.rangeMax !== undefined;
  const isRangeInvalid = value.rangeMax !== undefined && value.rangeMax <= value.value;
  const targetId =
    value.reference.scope === "other_exercise" ? value.reference.targetExerciseId : null;

  const handleValueChange = (next: number): void => {
    onChange({ ...value, value: next });
  };

  const handleRangeMaxChange = (rangeMax: number): void => {
    onChange({ ...value, rangeMax });
  };

  const handleAddRange = (): void => {
    onChange({ ...value, rangeMax: value.value + RANGE_MAX_OFFSET });
  };

  const handleRemoveRange = (): void => {
    onChange({ kind: "percentage", value: value.value, reference: value.reference });
  };

  const handleScopeChange = (_: unknown, scope: PercentageReferenceScope | null): void => {
    if (scope === null || scope === value.reference.scope) {
      return;
    }

    onChange({
      ...value,
      reference:
        scope === "self"
          ? { scope: "self" }
          : { scope: "other_exercise", targetExerciseId: EMPTY_TARGET },
    });
  };

  const handleTargetChange = (id: string | null): void => {
    onChange({
      ...value,
      reference: { scope: "other_exercise", targetExerciseId: id ?? EMPTY_TARGET },
    });
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <NumberField
          label="%"
          value={value.value}
          onChange={handleValueChange}
          min={PERCENT_MIN}
          step={1}
          disabled={disabled}
          maxWidth={PERCENT_FIELD_WIDTH}
        />

        {hasRange && value.rangeMax !== undefined && (
          <>
            <Typography variant="body2" color="text.subtle">
              {EN_DASH}
            </Typography>

            <NumberField
              label="Max%"
              value={value.rangeMax}
              onChange={handleRangeMaxChange}
              min={PERCENT_MIN}
              step={1}
              disabled={disabled}
              maxWidth={PERCENT_FIELD_WIDTH}
            />
          </>
        )}

        <Button
          size="tiny"
          variant="text"
          onClick={hasRange ? handleRemoveRange : handleAddRange}
          disabled={disabled}
        >
          {hasRange ? REMOVE_RANGE_LABEL : ADD_RANGE_LABEL}
        </Button>
      </Stack>

      {isRangeInvalid && <FormHelperText error>{RANGE_MAX_INVALID}</FormHelperText>}

      <LabeledToggleGroup
        label="reference"
        value={value.reference.scope}
        onChange={handleScopeChange}
        disabled={disabled}
      >
        {PERCENTAGE_REFERENCE_SCOPES.map((scope) => (
          <ToggleButton key={scope} value={scope}>
            {SCOPE_LABELS[scope]}
          </ToggleButton>
        ))}
      </LabeledToggleGroup>

      {value.reference.scope === "other_exercise" && (
        <ExercisePicker value={targetId} onChange={handleTargetChange} disabled={disabled} />
      )}
    </Stack>
  );
};

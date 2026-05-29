"use client";

import { Button, InputAdornment, Stack, TextField, Typography } from "@mui/material";

import { FormSection } from "@repo/ui";

import type { ParamsFor, SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";

type RunDistanceParams = ParamsFor<"run-distance">;

const DEFAULT_VALUE_KM = 5;
const DEFAULT_RANGE_MIN_KM = 5;
const DEFAULT_RANGE_MAX_KM = 8;
const DISTANCE_MIN = 0;
const DISTANCE_STEP = "any";
const KM_UNIT = "km";
const FIELD_WIDTH = 130;
const EN_DASH = "–";

export const runDistanceDefaultParams: RunDistanceParams = {
  modality: "RUN",
  distance: { unit: KM_UNIT, value: DEFAULT_VALUE_KM },
};

export const toRunDistanceParams = (mode: SchemaEditorMode): RunDistanceParams => {
  if (mode.kind === "create") {
    return runDistanceDefaultParams;
  }

  const { archetypeParams } = mode.schema.schema;

  if (archetypeParams.archetype === "run-distance") {
    return {
      modality: "RUN",
      ...(archetypeParams.params.distance && { distance: archetypeParams.params.distance }),
    };
  }

  return runDistanceDefaultParams;
};

const toInputValue = (n: number | undefined): string =>
  n !== undefined && Number.isFinite(n) ? String(n) : "";

const parseInput = (raw: string): number | undefined => {
  if (raw === "") {
    return undefined;
  }

  return Number(raw);
};

const kmAdornment = <InputAdornment position="end">{KM_UNIT}</InputAdornment>;

export const RunDistanceForm: React.FC<SchemaParamFormProps<RunDistanceParams>> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const isRange = value.distance?.range !== undefined;

  const setValueMode = (): void => {
    onChange({ modality: "RUN", distance: { unit: KM_UNIT, value: DEFAULT_VALUE_KM } });
  };

  const setRangeMode = (): void => {
    onChange({
      modality: "RUN",
      distance: {
        unit: KM_UNIT,
        range: { min: DEFAULT_RANGE_MIN_KM, max: DEFAULT_RANGE_MAX_KM },
      },
    });
  };

  const handleValueChange = (raw: string): void => {
    const next = parseInput(raw);

    onChange({
      modality: "RUN",
      distance: { unit: KM_UNIT, ...(next !== undefined && { value: next }) },
    });
  };

  const handleRangeChange = (key: "min" | "max", raw: string): void => {
    const current = value.distance?.range ?? {
      min: DEFAULT_RANGE_MIN_KM,
      max: DEFAULT_RANGE_MAX_KM,
    };

    onChange({
      modality: "RUN",
      distance: { unit: KM_UNIT, range: { ...current, [key]: Number(raw) } },
    });
  };

  return (
    <FormSection label="Run distance" helper="kilometres">
      {isRange ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            label="Min"
            type="number"
            size="small"
            value={toInputValue(value.distance?.range?.min)}
            onChange={(e) => handleRangeChange("min", e.target.value)}
            inputProps={{ min: DISTANCE_MIN, step: DISTANCE_STEP }}
            InputProps={{ endAdornment: kmAdornment }}
            error={error?.distance?.range?.min?.message !== undefined}
            helperText={error?.distance?.range?.min?.message}
            disabled={disabled}
            sx={{ maxWidth: FIELD_WIDTH }}
          />

          <Typography variant="body2" color="text.subtle">
            {EN_DASH}
          </Typography>

          <TextField
            label="Max"
            type="number"
            size="small"
            value={toInputValue(value.distance?.range?.max)}
            onChange={(e) => handleRangeChange("max", e.target.value)}
            inputProps={{ min: DISTANCE_MIN, step: DISTANCE_STEP }}
            InputProps={{ endAdornment: kmAdornment }}
            error={error?.distance?.range?.max?.message !== undefined}
            helperText={error?.distance?.range?.max?.message}
            disabled={disabled}
            sx={{ maxWidth: FIELD_WIDTH }}
          />

          <Button size="tiny" variant="text" disabled={disabled} onClick={setValueMode}>
            exact
          </Button>
        </Stack>
      ) : (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            label="Distance"
            type="number"
            size="small"
            value={toInputValue(value.distance?.value)}
            onChange={(e) => handleValueChange(e.target.value)}
            inputProps={{ min: DISTANCE_MIN, step: DISTANCE_STEP }}
            InputProps={{ endAdornment: kmAdornment }}
            error={error?.distance?.value?.message !== undefined}
            helperText={error?.distance?.value?.message}
            disabled={disabled}
            sx={{ maxWidth: FIELD_WIDTH }}
          />

          <Button size="tiny" variant="text" disabled={disabled} onClick={setRangeMode}>
            range
          </Button>
        </Stack>
      )}
    </FormSection>
  );
};

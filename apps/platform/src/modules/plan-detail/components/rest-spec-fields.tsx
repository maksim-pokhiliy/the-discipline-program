"use client";

import {
  FormHelperText,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { FieldErrors } from "react-hook-form";
import { z } from "zod";

import {
  REST_DURATION_UNITS,
  REST_QUALIFIERS,
  REST_SCOPES,
  type RestDurationUnit,
  type RestQualifier,
  type RestScope,
} from "@repo/contracts/lms/_shared";

const restDurationFormSchema = z
  .object({
    value: z.number().positive(),
    unit: z.enum(REST_DURATION_UNITS),
    rangeMax: z.number().positive().optional(),
  })
  .superRefine((d, ctx) => {
    const isRange = d.unit === "range_sec" || d.unit === "range_min";

    if (isRange && (d.rangeMax === undefined || d.rangeMax <= d.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rangeMax"],
        message: "rangeMax is required and must be greater than value for range units",
      });
    }

    if (!isRange && d.rangeMax !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rangeMax"],
        message: "rangeMax is only allowed for range units",
      });
    }
  });

export const restSpecFormSchema = z.object({
  duration: restDurationFormSchema,
  scope: z.enum(REST_SCOPES),
  qualifier: z.enum(REST_QUALIFIERS).optional(),
  setIndex: z.number().int().positive().optional(),
});

export type RestSpecFormValue = z.infer<typeof restSpecFormSchema>;

const QUALIFIER_NONE = "none";

type QualifierOption = RestQualifier | typeof QUALIFIER_NONE;

const QUALIFIER_OPTIONS: readonly QualifierOption[] = [QUALIFIER_NONE, ...REST_QUALIFIERS];

const REST_UNIT_LABELS: Record<RestDurationUnit, string> = {
  sec: "sec",
  min: "min",
  range_sec: "sec range",
  range_min: "min range",
};

const REST_SCOPE_LABELS: Record<RestScope, string> = {
  between_sets: "between sets",
  between_rounds: "between rounds",
  between_intervals: "between intervals",
  after_specific_set: "after set #",
};

const REST_QUALIFIER_LABELS: Record<QualifierOption, string> = {
  none: "—",
  until_recovery: "until recovery",
  fixed: "fixed",
  range: "range",
};

const DEFAULT_RANGE_MAX_OFFSET = 30;
const DURATION_FIELD_WIDTH = 88;
const SET_INDEX_FIELD_WIDTH = 88;
const EN_DASH = "–";

const isRangeUnit = (unit: RestDurationUnit): boolean =>
  unit === "range_sec" || unit === "range_min";

type RestSpecFieldsProps = {
  value: RestSpecFormValue;
  onChange: (next: RestSpecFormValue) => void;
  error?: FieldErrors<RestSpecFormValue> | undefined;
  disabled?: boolean;
};

export const RestSpecFields = ({
  value,
  onChange,
  error,
  disabled = false,
}: RestSpecFieldsProps) => {
  const rangeUnit = isRangeUnit(value.duration.unit);
  const durationError = error?.duration;
  const durationRootMessage = durationError?.root?.message;

  const handleValueChange = (raw: string): void => {
    onChange({ ...value, duration: { ...value.duration, value: Number(raw) } });
  };

  const handleRangeMaxChange = (raw: string): void => {
    onChange({ ...value, duration: { ...value.duration, rangeMax: Number(raw) } });
  };

  const handleUnitChange = (_: unknown, next: RestDurationUnit | null): void => {
    if (next === null) {
      return;
    }

    if (isRangeUnit(next)) {
      onChange({
        ...value,
        duration: {
          value: value.duration.value,
          unit: next,
          rangeMax: value.duration.rangeMax ?? value.duration.value + DEFAULT_RANGE_MAX_OFFSET,
        },
      });

      return;
    }

    onChange({ ...value, duration: { value: value.duration.value, unit: next } });
  };

  const handleScopeChange = (_: unknown, next: RestScope | null): void => {
    if (next === null) {
      return;
    }

    onChange({ ...value, scope: next });
  };

  const handleSetIndexChange = (raw: string): void => {
    onChange({
      duration: value.duration,
      scope: value.scope,
      ...(value.qualifier !== undefined && { qualifier: value.qualifier }),
      ...(raw !== "" && { setIndex: Number(raw) }),
    });
  };

  const handleQualifierChange = (_: unknown, next: QualifierOption | null): void => {
    if (next === null) {
      return;
    }

    onChange({
      duration: value.duration,
      scope: value.scope,
      ...(next !== QUALIFIER_NONE && { qualifier: next }),
      ...(value.setIndex !== undefined && { setIndex: value.setIndex }),
    });
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="caption" color="text.subtle">
          duration
        </Typography>

        <TextField
          label="Rest value"
          type="number"
          size="small"
          value={value.duration.value}
          onChange={(e) => handleValueChange(e.target.value)}
          inputProps={{ min: 1, step: 1 }}
          error={durationError?.value !== undefined}
          helperText={durationError?.value?.message}
          disabled={disabled}
          sx={{ maxWidth: DURATION_FIELD_WIDTH }}
        />

        {rangeUnit && (
          <>
            <Typography variant="body2" color="text.subtle">
              {EN_DASH}
            </Typography>

            <TextField
              label="Rest max"
              type="number"
              size="small"
              value={value.duration.rangeMax ?? ""}
              onChange={(e) => handleRangeMaxChange(e.target.value)}
              inputProps={{ min: 1, step: 1 }}
              error={durationError?.rangeMax !== undefined || durationRootMessage !== undefined}
              helperText={durationError?.rangeMax?.message ?? durationRootMessage}
              disabled={disabled}
              sx={{ maxWidth: DURATION_FIELD_WIDTH }}
            />
          </>
        )}

        <ToggleButtonGroup
          value={value.duration.unit}
          exclusive
          onChange={handleUnitChange}
          size="small"
          disabled={disabled}
        >
          {REST_DURATION_UNITS.map((unit) => (
            <ToggleButton key={unit} value={unit}>
              {REST_UNIT_LABELS[unit]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      {!rangeUnit && durationRootMessage !== undefined && (
        <FormHelperText error>{durationRootMessage}</FormHelperText>
      )}

      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="caption" color="text.subtle">
          scope
        </Typography>

        <ToggleButtonGroup
          value={value.scope}
          exclusive
          onChange={handleScopeChange}
          size="small"
          disabled={disabled}
        >
          {REST_SCOPES.map((scope) => (
            <ToggleButton key={scope} value={scope}>
              {REST_SCOPE_LABELS[scope]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      {value.scope === "after_specific_set" && (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="caption" color="text.subtle">
            set index
          </Typography>

          <TextField
            label="Set index"
            type="number"
            size="small"
            value={value.setIndex ?? ""}
            onChange={(e) => handleSetIndexChange(e.target.value)}
            inputProps={{ min: 1, step: 1 }}
            error={error?.setIndex !== undefined}
            helperText={error?.setIndex?.message}
            disabled={disabled}
            sx={{ maxWidth: SET_INDEX_FIELD_WIDTH }}
          />
        </Stack>
      )}

      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="caption" color="text.subtle">
          qualifier
        </Typography>

        <ToggleButtonGroup
          value={value.qualifier ?? QUALIFIER_NONE}
          exclusive
          onChange={handleQualifierChange}
          size="small"
          disabled={disabled}
        >
          {QUALIFIER_OPTIONS.map((option) => (
            <ToggleButton key={option} value={option}>
              {REST_QUALIFIER_LABELS[option]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
    </Stack>
  );
};

"use client";

import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { z } from "zod";

import {
  REST_DURATION_UNITS,
  REST_QUALIFIERS,
  REST_SCOPES,
  type RestDurationUnit,
  type RestQualifier,
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

const REST_UNIT_LABELS: Record<RestDurationUnit, string> = {
  sec: "Seconds",
  min: "Minutes",
  range_sec: "Range (seconds)",
  range_min: "Range (minutes)",
};

const REST_SCOPE_LABELS: Record<(typeof REST_SCOPES)[number], string> = {
  between_sets: "Between sets",
  between_rounds: "Between rounds",
  between_intervals: "Between intervals",
  after_specific_set: "After a specific set",
};

const REST_QUALIFIER_LABELS: Record<RestQualifier, string> = {
  until_recovery: "Until recovery",
  fixed: "Fixed",
  range: "Range",
};

const DEFAULT_RANGE_MAX_OFFSET = 30;

const isRangeUnit = (unit: RestDurationUnit): boolean =>
  unit === "range_sec" || unit === "range_min";

type RestSpecFieldsProps = {
  value: RestSpecFormValue;
  onChange: (next: RestSpecFormValue) => void;
  disabled?: boolean;
};

export const RestSpecFields = ({ value, onChange, disabled = false }: RestSpecFieldsProps) => {
  const rangeUnit = isRangeUnit(value.duration.unit);
  const qualifierEnabled = value.qualifier !== undefined;

  const handleUnitChange = (next: RestDurationUnit) => {
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

    onChange({
      ...value,
      duration: { value: value.duration.value, unit: next },
    });
  };

  const handleQualifierToggle = (_: unknown, next: boolean) => {
    onChange({
      duration: value.duration,
      scope: value.scope,
      ...(next && { qualifier: "fixed" }),
      ...(value.setIndex !== undefined && { setIndex: value.setIndex }),
    });
  };

  const handleSetIndexChange = (raw: string) => {
    onChange({
      duration: value.duration,
      scope: value.scope,
      ...(value.qualifier !== undefined && { qualifier: value.qualifier }),
      ...(raw !== "" && { setIndex: Number(raw) }),
    });
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        <TextField
          label="Rest value"
          type="number"
          size="small"
          value={value.duration.value}
          onChange={(e) =>
            onChange({
              ...value,
              duration: { ...value.duration, value: Number(e.target.value) },
            })
          }
          inputProps={{ min: 1, step: 1 }}
          disabled={disabled}
          sx={{ maxWidth: 140 }}
        />

        {rangeUnit && (
          <TextField
            label="Rest max"
            type="number"
            size="small"
            value={value.duration.rangeMax ?? 0}
            onChange={(e) =>
              onChange({
                ...value,
                duration: { ...value.duration, rangeMax: Number(e.target.value) },
              })
            }
            inputProps={{ min: 1, step: 1 }}
            disabled={disabled}
            sx={{ maxWidth: 140 }}
          />
        )}

        <FormControl size="small" sx={{ minWidth: 180 }} disabled={disabled}>
          <InputLabel>Unit</InputLabel>
          <Select
            value={value.duration.unit}
            label="Unit"
            onChange={(e) => handleUnitChange(e.target.value as RestDurationUnit)}
          >
            {REST_DURATION_UNITS.map((u) => (
              <MenuItem key={u} value={u}>
                {REST_UNIT_LABELS[u]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <FormControl size="small" sx={{ minWidth: 220 }} disabled={disabled}>
        <InputLabel>Rest placement</InputLabel>
        <Select
          value={value.scope}
          label="Rest placement"
          onChange={(e) =>
            onChange({ ...value, scope: e.target.value as (typeof REST_SCOPES)[number] })
          }
        >
          {REST_SCOPES.map((s) => (
            <MenuItem key={s} value={s}>
              {REST_SCOPE_LABELS[s]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={qualifierEnabled}
              onChange={handleQualifierToggle}
              disabled={disabled}
            />
          }
          label="Rest qualifier"
        />

        {qualifierEnabled && value.qualifier !== undefined && (
          <Stack sx={{ pl: 4, pt: 1 }}>
            <FormControl size="small" sx={{ minWidth: 200 }} disabled={disabled}>
              <InputLabel>Qualifier</InputLabel>
              <Select
                value={value.qualifier}
                label="Qualifier"
                onChange={(e) => onChange({ ...value, qualifier: e.target.value as RestQualifier })}
              >
                {REST_QUALIFIERS.map((q) => (
                  <MenuItem key={q} value={q}>
                    {REST_QUALIFIER_LABELS[q]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        )}
      </Box>

      <TextField
        label="Set index (optional)"
        type="number"
        size="small"
        value={value.setIndex ?? ""}
        onChange={(e) => handleSetIndexChange(e.target.value)}
        inputProps={{ min: 1, step: 1 }}
        disabled={disabled}
        sx={{ maxWidth: 200 }}
      />
    </Stack>
  );
};

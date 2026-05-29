"use client";

import { Stack, TextField, Typography } from "@mui/material";

import { FormSection } from "@repo/ui";

import type { ParamsFor, SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";

type TimeWindowParams = ParamsFor<"time-window-outer">;

const DEFAULT_START_HH_MM = "09:30";
const DEFAULT_END_HH_MM = "09:50";
const HH_MM_PLACEHOLDER = "09:30";
const FIELD_WIDTH = 110;
const ARROW = "→";

export const timeWindowDefaultParams: TimeWindowParams = {
  window: { startHhMm: DEFAULT_START_HH_MM, endHhMm: DEFAULT_END_HH_MM },
};

export const toTimeWindowParams = (mode: SchemaEditorMode): TimeWindowParams => {
  if (mode.kind === "create") {
    return timeWindowDefaultParams;
  }

  const { archetypeParams } = mode.schema.schema;

  if (archetypeParams.archetype === "time-window-outer") {
    return { window: { ...archetypeParams.params.window } };
  }

  return timeWindowDefaultParams;
};

export const TimeWindowForm: React.FC<SchemaParamFormProps<TimeWindowParams>> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => (
  <FormSection label="Time window" helper="wall-clock window">
    <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", flexWrap: "wrap" }}>
      <TextField
        label="Start"
        size="small"
        placeholder={HH_MM_PLACEHOLDER}
        value={value.window.startHhMm}
        onChange={(e) => onChange({ window: { ...value.window, startHhMm: e.target.value } })}
        error={error?.window?.startHhMm?.message !== undefined}
        helperText={error?.window?.startHhMm?.message}
        disabled={disabled}
        sx={{ maxWidth: FIELD_WIDTH }}
      />

      <Typography variant="body2" color="text.subtle" sx={{ pt: 1 }}>
        {ARROW}
      </Typography>

      <TextField
        label="End"
        size="small"
        placeholder={HH_MM_PLACEHOLDER}
        value={value.window.endHhMm}
        onChange={(e) => onChange({ window: { ...value.window, endHhMm: e.target.value } })}
        error={error?.window?.endHhMm?.message !== undefined}
        helperText={error?.window?.endHhMm?.message}
        disabled={disabled}
        sx={{ maxWidth: FIELD_WIDTH }}
      />
    </Stack>
  </FormSection>
);

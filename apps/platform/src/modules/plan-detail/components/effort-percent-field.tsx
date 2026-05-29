"use client";

import { Button, Stack, TextField, Typography } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { EffortPercent } from "@repo/contracts/lms/_shared";
import { ToggleSection } from "@repo/ui";

const EFFORT_DEFAULT_VALUE = 80;
const EFFORT_RANGE_DEFAULT_MIN = 75;
const EFFORT_RANGE_DEFAULT_MAX = 85;
const EFFORT_VALUE_FIELD_WIDTH = 80;
const EFFORT_RANGE_FIELD_WIDTH = 70;
const EN_DASH = "–";

type EffortPercentFieldProps = {
  value: EffortPercent | undefined;
  onChange: (next: EffortPercent | undefined) => void;
  error?: FieldErrors<EffortPercent> | undefined;
  disabled?: boolean;
};

export const EffortPercentField = ({
  value,
  onChange,
  error,
  disabled = false,
}: EffortPercentFieldProps) => {
  const isOn = value !== undefined;
  const hasError = error !== undefined;

  const handleToggle = () => {
    onChange(isOn ? undefined : { value: EFFORT_DEFAULT_VALUE });
  };

  return (
    <ToggleSection
      on={isOn}
      label="Effort %"
      helper="% of athlete's 1RM / max"
      onToggle={handleToggle}
      disabled={disabled}
    >
      {value !== undefined && "range" in value ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            type="number"
            size="small"
            value={value.range.min}
            onChange={(e) =>
              onChange({ range: { min: Number(e.target.value), max: value.range.max } })
            }
            inputProps={{ min: 1, max: 100 }}
            error={hasError}
            disabled={disabled}
            sx={{ maxWidth: EFFORT_RANGE_FIELD_WIDTH }}
          />

          <Typography variant="body2" color="text.subtle">
            {EN_DASH}
          </Typography>

          <TextField
            type="number"
            size="small"
            value={value.range.max}
            onChange={(e) =>
              onChange({ range: { min: value.range.min, max: Number(e.target.value) } })
            }
            inputProps={{ min: 1, max: 100 }}
            error={hasError}
            helperText={error?.root?.message}
            disabled={disabled}
            sx={{ maxWidth: EFFORT_RANGE_FIELD_WIDTH }}
          />

          <Typography variant="caption">%</Typography>

          <Button
            size="tiny"
            variant="text"
            disabled={disabled}
            onClick={() => onChange({ value: EFFORT_DEFAULT_VALUE })}
          >
            single
          </Button>
        </Stack>
      ) : (
        value !== undefined &&
        "value" in value && (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              type="number"
              size="small"
              value={value.value}
              onChange={(e) => onChange({ value: Number(e.target.value) })}
              inputProps={{ min: 1, max: 100 }}
              error={hasError}
              helperText={error?.root?.message}
              disabled={disabled}
              sx={{ maxWidth: EFFORT_VALUE_FIELD_WIDTH }}
            />

            <Typography variant="caption">%</Typography>

            <Button
              size="tiny"
              variant="text"
              disabled={disabled}
              onClick={() =>
                onChange({
                  range: { min: EFFORT_RANGE_DEFAULT_MIN, max: EFFORT_RANGE_DEFAULT_MAX },
                })
              }
            >
              range
            </Button>
          </Stack>
        )
      )}
    </ToggleSection>
  );
};

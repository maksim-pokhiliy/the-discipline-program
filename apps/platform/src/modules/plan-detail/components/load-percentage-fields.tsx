"use client";

import { Stack, TextField } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { Load, PercentageReference } from "@repo/contracts/lms/_shared";

import { PercentageReferenceEditor } from "./percentage-reference-editor";

type PercentageLoad = Extract<Load, { kind: "percentage" }>;
type RestrictedPercentageReference = Extract<
  PercentageReference,
  { scope: "self" | "movement_family" }
>;

const PERCENTAGE_MIN = 0;
const PERCENTAGE_MAX = 200;

const toRestrictedReference = (reference: PercentageReference): RestrictedPercentageReference => {
  if (reference.scope === "movement_family") {
    return reference;
  }

  return { scope: "self" };
};

type LoadPercentageFieldsProps = {
  value: PercentageLoad;
  onChange: (next: PercentageLoad) => void;
  error?: FieldErrors<PercentageLoad> | undefined;
  disabled?: boolean;
};

export const LoadPercentageFields = ({
  value,
  onChange,
  error,
  disabled = false,
}: LoadPercentageFieldsProps) => {
  const handleValueChange = (raw: string) => {
    onChange({ ...value, value: Number(raw) });
  };

  const handleRangeMaxChange = (raw: string) => {
    if (raw === "") {
      onChange({ kind: "percentage", value: value.value, reference: value.reference });

      return;
    }

    onChange({ ...value, rangeMax: Number(raw) });
  };

  const handleReferenceChange = (reference: RestrictedPercentageReference) => {
    onChange({ ...value, reference });
  };

  const rootMessage = error?.root?.message;

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        <TextField
          label="Percentage"
          type="number"
          size="small"
          value={typeof value.value === "number" ? value.value : ""}
          onChange={(e) => handleValueChange(e.target.value)}
          inputProps={{ min: PERCENTAGE_MIN, max: PERCENTAGE_MAX, step: 1 }}
          error={error?.value !== undefined}
          helperText={error?.value?.message}
          disabled={disabled}
          sx={{ maxWidth: 140 }}
        />

        <TextField
          label="Max % (optional)"
          type="number"
          size="small"
          value={typeof value.rangeMax === "number" ? value.rangeMax : ""}
          onChange={(e) => handleRangeMaxChange(e.target.value)}
          inputProps={{ min: PERCENTAGE_MIN, max: PERCENTAGE_MAX, step: 1 }}
          error={error?.rangeMax !== undefined || rootMessage !== undefined}
          helperText={error?.rangeMax?.message ?? rootMessage}
          disabled={disabled}
          sx={{ maxWidth: 180 }}
        />
      </Stack>

      <PercentageReferenceEditor
        value={toRestrictedReference(value.reference)}
        onChange={handleReferenceChange}
        error={error?.reference}
        disabled={disabled}
      />
    </Stack>
  );
};

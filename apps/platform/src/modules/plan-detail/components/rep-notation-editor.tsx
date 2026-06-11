"use client";

import { FormHelperText, Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import {
  REP_NOTATION_KINDS,
  type RepNotation,
  type RepNotationKind,
} from "@repo/contracts/lms/_shared";

import { RepNotationFields } from "./rep-notation-fields";

const REP_NOTATION_KIND_LABELS: Record<RepNotationKind, string> = {
  count: "Count",
  range: "Range",
  unit_bound: "Time/Dist",
  max: "Max",
};

const COUNT_DEFAULT_VALUE = 5;
const RANGE_DEFAULT_MIN = 5;
const RANGE_DEFAULT_MAX = 10;
const UNIT_BOUND_DEFAULT_VALUE = 30;

const buildDefaultRepNotation = (kind: RepNotationKind): RepNotation => {
  switch (kind) {
    case "count":
      return { kind: "count", value: COUNT_DEFAULT_VALUE };
    case "range":
      return { kind: "range", min: RANGE_DEFAULT_MIN, max: RANGE_DEFAULT_MAX };
    case "unit_bound":
      return { kind: "unit_bound", unit: "sec", value: UNIT_BOUND_DEFAULT_VALUE };
    case "max":
      return { kind: "max" };
  }
};

type RepNotationEditorProps = {
  value: RepNotation;
  onChange: (next: RepNotation) => void;
  error?: FieldErrors<RepNotation> | undefined;
  disabled?: boolean;
};

export const RepNotationEditor = ({
  value,
  onChange,
  error,
  disabled = false,
}: RepNotationEditorProps) => {
  const rootMessage = error?.root?.message;

  const handleKindChange = (_: unknown, next: RepNotationKind | null): void => {
    if (next === null) {
      return;
    }

    onChange(buildDefaultRepNotation(next));
  };

  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup
        aria-label="rep notation kind"
        value={value.kind}
        exclusive
        onChange={handleKindChange}
        size="small"
        disabled={disabled}
      >
        {REP_NOTATION_KINDS.map((kind) => (
          <ToggleButton key={kind} value={kind}>
            {REP_NOTATION_KIND_LABELS[kind]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <RepNotationFields value={value} onChange={onChange} error={error} disabled={disabled} />

      {rootMessage !== undefined && <FormHelperText error>{rootMessage}</FormHelperText>}
    </Stack>
  );
};

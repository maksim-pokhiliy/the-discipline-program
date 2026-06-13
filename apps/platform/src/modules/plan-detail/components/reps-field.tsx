"use client";

import { type ReactNode } from "react";

import { Button, Stack, TextField, ToggleButton } from "@mui/material";

import {
  REP_NOTATION_KINDS,
  REP_UNITS,
  type RepNotation,
  type RepNotationKind,
} from "@repo/contracts/lms/_shared";
import { LabeledToggleGroup } from "@repo/ui";

import { NumberField } from "./number-field";
import { RepsRangeFields } from "./reps-range-fields";
import { RepsUnitBoundFields } from "./reps-unit-bound-fields";

const LABEL = "reps";
const CLEAR_LABEL = "inherit";
const DEFAULT_COUNT = 1;
const DEFAULT_RANGE_MIN = 1;
const DEFAULT_RANGE_MAX = 2;
const DEFAULT_UNIT_VALUE = 1;
const FIELD_MIN = 1;
const VALUE_FIELD_WIDTH = 90;

const KIND_LABELS: Record<RepNotationKind, string> = {
  count: "Count",
  range: "Range",
  unit_bound: "Time·dist",
  max: "Max",
};

const KIND_DEFAULTS: Record<RepNotationKind, RepNotation> = {
  count: { kind: "count", value: DEFAULT_COUNT },
  range: { kind: "range", min: DEFAULT_RANGE_MIN, max: DEFAULT_RANGE_MAX },
  unit_bound: { kind: "unit_bound", unit: REP_UNITS[0], value: DEFAULT_UNIT_VALUE },
  max: { kind: "max" },
};

type RepsFieldProps = {
  value: RepNotation | null;
  onChange: (next: RepNotation | null) => void;
  disabled?: boolean;
};

export const RepsField = ({
  value,
  onChange,
  disabled = false,
}: RepsFieldProps): React.ReactElement => {
  const handleKindChange = (_: unknown, next: RepNotationKind | null): void => {
    if (next === null || next === value?.kind) {
      return;
    }

    onChange(KIND_DEFAULTS[next]);
  };

  const renderBody = (): ReactNode => {
    if (value === null) {
      return null;
    }

    switch (value.kind) {
      case "count":
        return (
          <NumberField
            label="Reps"
            value={value.value}
            onChange={(reps) => onChange({ kind: "count", value: reps })}
            min={FIELD_MIN}
            disabled={disabled}
            maxWidth={VALUE_FIELD_WIDTH}
          />
        );
      case "range":
        return <RepsRangeFields value={value} onChange={onChange} disabled={disabled} />;
      case "unit_bound":
        return <RepsUnitBoundFields value={value} onChange={onChange} disabled={disabled} />;
      case "max":
        return (
          <TextField
            label="Cap note (optional)"
            size="small"
            value={value.tail ?? ""}
            onChange={(e) =>
              onChange(
                e.target.value === "" ? { kind: "max" } : { kind: "max", tail: e.target.value },
              )
            }
            placeholder="e.g. max reps, AMRAP"
            disabled={disabled}
          />
        );
      default:
        value satisfies never;

        return null;
    }
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <LabeledToggleGroup<RepNotationKind | null>
          label={LABEL}
          value={value?.kind ?? null}
          onChange={handleKindChange}
          disabled={disabled}
        >
          {REP_NOTATION_KINDS.map((kind) => (
            <ToggleButton key={kind} value={kind}>
              {KIND_LABELS[kind]}
            </ToggleButton>
          ))}
        </LabeledToggleGroup>

        <Button size="tiny" variant="text" onClick={() => onChange(null)} disabled={disabled}>
          {CLEAR_LABEL}
        </Button>
      </Stack>

      {renderBody()}
    </Stack>
  );
};

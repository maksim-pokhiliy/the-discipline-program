"use client";

import { type ReactNode } from "react";

import { Button, Stack, ToggleButton } from "@mui/material";

import { type Load, LOAD_KINDS, type LoadKind } from "@repo/contracts/lms/_shared";
import { LabeledToggleGroup } from "@repo/ui";

import { LoadAbsoluteFields } from "./load-absolute-fields";
import { LoadByProfileFields } from "./load-by-profile-fields";
import { LoadPercentageFields } from "./load-percentage-fields";

const LABEL = "load";
const CLEAR_LABEL = "no load";
const DEFAULT_KG = 0;
const DEFAULT_PERCENT = 0;
const DEFAULT_PROFILE_KG = 0;
const SINGLE_COUNT = 1;
const EMPTY_PROFILE_LABEL = "";

const KIND_LABELS: Record<LoadKind, string> = {
  absolute: "Absolute",
  percentage: "% 1RM",
  bodyweight: "Bodyweight",
  byProfile: "By profile",
};

const KIND_DEFAULTS: Record<LoadKind, Load> = {
  absolute: { kind: "absolute", count: SINGLE_COUNT, kg: DEFAULT_KG },
  percentage: { kind: "percentage", value: DEFAULT_PERCENT, reference: { scope: "self" } },
  bodyweight: { kind: "bodyweight" },
  byProfile: {
    kind: "byProfile",
    entries: [{ label: EMPTY_PROFILE_LABEL, kg: DEFAULT_PROFILE_KG }],
  },
};

type LoadEditorProps = {
  value: Load | null;
  onChange: (next: Load | null) => void;
  disabled?: boolean;
};

export const LoadEditor = ({
  value,
  onChange,
  disabled = false,
}: LoadEditorProps): React.ReactElement => {
  const handleKindChange = (_: unknown, next: LoadKind | null): void => {
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
      case "absolute":
        return <LoadAbsoluteFields value={value} onChange={onChange} disabled={disabled} />;
      case "percentage":
        return <LoadPercentageFields value={value} onChange={onChange} disabled={disabled} />;
      case "bodyweight":
        return null;
      case "byProfile":
        return <LoadByProfileFields value={value} onChange={onChange} disabled={disabled} />;
      default:
        value satisfies never;

        return null;
    }
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <LabeledToggleGroup<LoadKind | null>
          label={LABEL}
          value={value?.kind ?? null}
          onChange={handleKindChange}
          disabled={disabled}
        >
          {LOAD_KINDS.map((kind) => (
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

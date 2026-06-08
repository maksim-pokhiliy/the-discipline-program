"use client";

import { type MouseEvent } from "react";

import { ToggleButton } from "@mui/material";

import type { StagedProgramKind } from "@repo/contracts/lms/_shared";
import { LabeledToggleGroup } from "@repo/ui";

import { PROGRAM_KIND_LABELS } from "../../lib/compose-axis-labels";

const LABEL = "program";
const NONE = "none";
const NONE_LABEL = "none";

type ProgramKindOption = StagedProgramKind | typeof NONE;

const PROGRAM_KIND_OPTIONS: { value: ProgramKindOption; label: string }[] = [
  { value: NONE, label: NONE_LABEL },
  { value: "wave", label: PROGRAM_KIND_LABELS.wave },
  { value: "cluster", label: PROGRAM_KIND_LABELS.cluster },
  { value: "drop_set", label: PROGRAM_KIND_LABELS.drop_set },
];

type ProgramKindAxisFieldProps = {
  value?: StagedProgramKind | undefined;
  onChange: (next?: StagedProgramKind) => void;
  disabled?: boolean;
};

export const ProgramKindAxisField: React.FC<ProgramKindAxisFieldProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const selected: ProgramKindOption = value ?? NONE;

  const handleChange = (_: MouseEvent<HTMLElement>, next: ProgramKindOption | null) => {
    if (next === null) {
      return;
    }

    onChange(next === NONE ? undefined : next);
  };

  return (
    <LabeledToggleGroup label={LABEL} value={selected} onChange={handleChange} disabled={disabled}>
      {PROGRAM_KIND_OPTIONS.map((option) => (
        <ToggleButton key={option.value} value={option.value}>
          {option.label}
        </ToggleButton>
      ))}
    </LabeledToggleGroup>
  );
};

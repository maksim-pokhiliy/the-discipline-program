"use client";

import { type MouseEvent } from "react";

import { ToggleButton } from "@mui/material";

import { LabeledToggleGroup } from "@repo/ui";

import type { ArrangementAxis } from "../../compose-tree.types";

const LABEL = "arrangement";

const ARRANGEMENT_OPTIONS: { kind: ArrangementAxis["kind"]; label: string }[] = [
  { kind: "ordered", label: "ordered" },
  { kind: "parallel", label: "parallel" },
  { kind: "superset", label: "superset" },
];

type ArrangementAxisFieldProps = {
  value: ArrangementAxis;
  onChange: (next: ArrangementAxis) => void;
  disabled?: boolean;
};

export const ArrangementAxisField: React.FC<ArrangementAxisFieldProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const handleChange = (_: MouseEvent<HTMLElement>, next: ArrangementAxis["kind"] | null): void => {
    if (next === null) {
      return;
    }

    onChange({ kind: next });
  };

  return (
    <LabeledToggleGroup
      label={LABEL}
      value={value.kind}
      onChange={handleChange}
      disabled={disabled}
    >
      {ARRANGEMENT_OPTIONS.map((option) => (
        <ToggleButton key={option.kind} value={option.kind}>
          {option.label}
        </ToggleButton>
      ))}
    </LabeledToggleGroup>
  );
};

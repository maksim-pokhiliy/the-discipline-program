"use client";

import { type MouseEvent, type ReactNode } from "react";

import { Stack, ToggleButton } from "@mui/material";

import type { TimeCap } from "@repo/contracts/lms/_shared";
import { LabeledToggleGroup } from "@repo/ui";

import { CountOrRange } from "../../../components/count-or-range-field";
import { StepArrayFields } from "../../../components/step-array-fields";
import { TimeCapFields } from "../../../components/time-cap-fields";
import type { RepetitionAxis } from "../../compose-tree.types";

import { CadenceAxisField } from "./cadence-axis-field";
import { IntervalAxisField } from "./interval-axis-field";
import { WindowAxisField } from "./window-axis-field";

const LABEL = "repetition";

const DEFAULT_TIME_CAP: TimeCap = { min: 12, unit: "min" };

const REPETITION_DEFAULTS: Record<RepetitionAxis["kind"], RepetitionAxis> = {
  once: { kind: "once" },
  count: { kind: "count", count: 3 },
  ladder: { kind: "ladder", steps: [21, 15, 9] },
  timeCap: { kind: "timeCap", cap: DEFAULT_TIME_CAP },
  cadence: { kind: "cadence", everyMin: 1, rounds: 4 },
  window: { kind: "window", startHhMm: "06:00", endHhMm: "09:00" },
  interval: { kind: "interval", workMin: 2, offMin: 1, count: 3 },
};

const REPETITION_OPTIONS: { kind: RepetitionAxis["kind"]; label: string }[] = [
  { kind: "once", label: "once" },
  { kind: "count", label: "count" },
  { kind: "ladder", label: "ladder" },
  { kind: "timeCap", label: "time cap" },
  { kind: "cadence", label: "cadence" },
  { kind: "window", label: "window" },
  { kind: "interval", label: "interval" },
];

type RepetitionAxisFieldProps = {
  value: RepetitionAxis;
  onChange: (next: RepetitionAxis) => void;
  disabled?: boolean;
};

export const RepetitionAxisField: React.FC<RepetitionAxisFieldProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const handleKindChange = (_: MouseEvent<HTMLElement>, next: RepetitionAxis["kind"] | null) => {
    if (next === null || next === value.kind) {
      return;
    }

    onChange(REPETITION_DEFAULTS[next]);
  };

  const renderVariantBody = (): ReactNode => {
    switch (value.kind) {
      case "once":
        return null;
      case "count":
        return (
          <CountOrRange
            value={value.count}
            onChange={(count) => onChange({ kind: "count", count })}
            disabled={disabled}
          />
        );
      case "ladder":
        return (
          <StepArrayFields
            value={value.steps}
            onChange={(steps) => onChange({ kind: "ladder", steps })}
            disabled={disabled}
          />
        );
      case "timeCap":
        return (
          <TimeCapFields
            value={value.cap}
            onChange={(cap) => onChange({ kind: "timeCap", cap: cap ?? DEFAULT_TIME_CAP })}
            disabled={disabled}
          />
        );
      case "cadence":
        return (
          <CadenceAxisField
            value={value}
            onChange={(next) => onChange({ kind: "cadence", ...next })}
            disabled={disabled}
          />
        );
      case "window":
        return (
          <WindowAxisField
            value={value}
            onChange={(next) => onChange({ kind: "window", ...next })}
            disabled={disabled}
          />
        );
      case "interval":
        return (
          <IntervalAxisField
            value={value}
            onChange={(next) => onChange({ kind: "interval", ...next })}
            disabled={disabled}
          />
        );
      default:
        value satisfies never;

        return null;
    }
  };

  return (
    <Stack direction="column" spacing={1}>
      <LabeledToggleGroup
        label={LABEL}
        value={value.kind}
        onChange={handleKindChange}
        disabled={disabled}
      >
        {REPETITION_OPTIONS.map((option) => (
          <ToggleButton key={option.kind} value={option.kind}>
            {option.label}
          </ToggleButton>
        ))}
      </LabeledToggleGroup>

      {renderVariantBody()}
    </Stack>
  );
};

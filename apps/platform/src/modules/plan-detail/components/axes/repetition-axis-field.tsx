"use client";

import { type ReactNode, useState } from "react";

import { FormHelperText, Stack } from "@mui/material";

import { isRepetitionDirty } from "../../lib/is-repetition-dirty";
import { CountOrRange } from "../count-or-range-field";
import { KindSwitchConfirm } from "../kind-switch-confirm";
import { StepArrayFields } from "../step-array-fields";
import { TimeCapFields } from "../time-cap-fields";

import type { RepetitionAxis } from "./axis-draft.types";
import { AxisFieldSection } from "./axis-field-section";
import { AxisModeButtonGrid } from "./axis-mode-button-grid";
import { REPETITION_TILES } from "./axis-modes";
import { CadenceAxisField } from "./cadence-axis-field";
import { IntervalAxisField } from "./interval-axis-field";
import { DEFAULT_TIME_CAP, REPETITION_DEFAULTS } from "./repetition-defaults";

const LABEL = "repetition";

type RepetitionAxisFieldProps = {
  value: RepetitionAxis;
  onChange: (next: RepetitionAxis) => void;
  error?: string | undefined;
  disabled?: boolean;
};

export const RepetitionAxisField: React.FC<RepetitionAxisFieldProps> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [pendingNext, setPendingNext] = useState<RepetitionAxis["kind"] | null>(null);

  const activeHint = REPETITION_TILES.find((tile) => tile.kind === value.kind)?.hint;

  const handleKindChange = (next: RepetitionAxis["kind"]) => {
    if (next === value.kind) {
      return;
    }

    if (isRepetitionDirty(value)) {
      setPendingNext(next);

      return;
    }

    onChange(REPETITION_DEFAULTS[next]);
  };

  const handleConfirmSwitch = (): void => {
    if (pendingNext !== null) {
      onChange(REPETITION_DEFAULTS[pendingNext]);
    }

    setPendingNext(null);
  };

  const handleCancelSwitch = (): void => setPendingNext(null);

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
      <AxisFieldSection label={LABEL} hint={activeHint}>
        <AxisModeButtonGrid
          label={LABEL}
          value={value.kind}
          tiles={REPETITION_TILES}
          onChange={handleKindChange}
        />
      </AxisFieldSection>

      {error !== undefined ? <FormHelperText error>{error}</FormHelperText> : null}

      {renderVariantBody()}

      <KindSwitchConfirm
        open={pendingNext !== null}
        onConfirm={handleConfirmSwitch}
        onCancel={handleCancelSwitch}
      />
    </Stack>
  );
};

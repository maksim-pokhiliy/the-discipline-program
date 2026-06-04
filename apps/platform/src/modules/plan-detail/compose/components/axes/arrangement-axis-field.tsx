"use client";

import { type MouseEvent, type ReactNode } from "react";

import { Stack, ToggleButton } from "@mui/material";

import { LabeledToggleGroup } from "@repo/ui";

import type { ArrangementAxis } from "../../compose-tree.types";
import type { ArrangementTargetRef } from "../../lib/arrangement-targets";

import { ParallelArrangementFields } from "./parallel-arrangement-fields";
import { SupersetArrangementFields } from "./superset-arrangement-fields";

const LABEL = "arrangement";

const ARRANGEMENT_DEFAULTS: Record<ArrangementAxis["kind"], ArrangementAxis> = {
  ordered: { kind: "ordered" },
  parallel: { kind: "parallel", interleaveOrder: "round_by_round", tracks: [] },
  superset: { kind: "superset", pairs: [{ label: "", rowIds: [] }] },
};

const ARRANGEMENT_OPTIONS: { kind: ArrangementAxis["kind"]; label: string }[] = [
  { kind: "ordered", label: "ordered" },
  { kind: "parallel", label: "parallel" },
  { kind: "superset", label: "superset" },
];

type ArrangementAxisFieldProps = {
  value: ArrangementAxis;
  onChange: (next: ArrangementAxis) => void;
  childContainers: ArrangementTargetRef[];
  descendantRows: ArrangementTargetRef[];
  rowsByTrack: Record<string, ArrangementTargetRef[]>;
  disabled?: boolean;
};

export const ArrangementAxisField: React.FC<ArrangementAxisFieldProps> = ({
  value,
  onChange,
  childContainers,
  descendantRows,
  rowsByTrack,
  disabled = false,
}) => {
  const handleKindChange = (_: MouseEvent<HTMLElement>, next: ArrangementAxis["kind"] | null) => {
    if (next === null || next === value.kind) {
      return;
    }

    onChange(ARRANGEMENT_DEFAULTS[next]);
  };

  const renderVariantBody = (): ReactNode => {
    switch (value.kind) {
      case "ordered":
        return null;
      case "parallel":
        return (
          <ParallelArrangementFields
            value={value}
            onChange={onChange}
            childContainers={childContainers}
            rowsByTrack={rowsByTrack}
            disabled={disabled}
          />
        );
      case "superset":
        return (
          <SupersetArrangementFields
            value={value}
            onChange={onChange}
            descendantRows={descendantRows}
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
        {ARRANGEMENT_OPTIONS.map((option) => (
          <ToggleButton key={option.kind} value={option.kind}>
            {option.label}
          </ToggleButton>
        ))}
      </LabeledToggleGroup>

      {renderVariantBody()}
    </Stack>
  );
};

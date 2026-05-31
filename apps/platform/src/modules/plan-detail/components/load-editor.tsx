"use client";

import { Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import { LOAD_KINDS, type Load, type LoadKind } from "@repo/contracts/lms/_shared";

import { LoadAbsoluteFields } from "./load-absolute-fields";
import { LoadBodyweightFields } from "./load-bodyweight-fields";
import { LoadPercentageFields } from "./load-percentage-fields";
import { LoadUnspecifiedFields } from "./load-unspecified-fields";
import { LoadWithoutWeightFields } from "./load-without-weight-fields";
import { buildDefaultLoad } from "./weight-load-defaults";

const LOAD_KIND_LABELS: Record<LoadKind, string> = {
  absolute: "Absolute kg",
  percentage: "% of ref",
  bodyweight: "BW",
  without_weight: "No wt",
  unspecified: "—",
};

type LoadEditorProps = {
  value: Load;
  onChange: (next: Load) => void;
  error?: FieldErrors<Load> | undefined;
  disabled?: boolean;
};

export const LoadEditor = ({ value, onChange, error, disabled = false }: LoadEditorProps) => {
  const handleKindChange = (_: unknown, next: LoadKind | null) => {
    if (next === null) {
      return;
    }

    onChange(buildDefaultLoad(next));
  };

  const renderKind = (): React.ReactNode => {
    switch (value.kind) {
      case "absolute":
        return (
          <LoadAbsoluteFields value={value} onChange={onChange} error={error} disabled={disabled} />
        );
      case "percentage":
        return (
          <LoadPercentageFields
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        );
      case "bodyweight":
        return <LoadBodyweightFields />;
      case "without_weight":
        return <LoadWithoutWeightFields />;
      case "unspecified":
        return <LoadUnspecifiedFields />;
    }
  };

  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup
        aria-label="load kind"
        value={value.kind}
        exclusive
        onChange={handleKindChange}
        size="small"
        disabled={disabled}
      >
        {LOAD_KINDS.map((kind) => (
          <ToggleButton key={kind} value={kind}>
            {LOAD_KIND_LABELS[kind]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {renderKind()}
    </Stack>
  );
};

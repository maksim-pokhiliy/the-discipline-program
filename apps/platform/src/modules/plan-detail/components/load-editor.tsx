"use client";

import { FormControl, InputLabel, MenuItem, Select, Stack } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import { LOAD_KINDS, type Load, type LoadKind } from "@repo/contracts/lms/_shared";

import { LoadAbsoluteFields } from "./load-absolute-fields";
import { LoadBodyweightFields } from "./load-bodyweight-fields";
import { LoadPercentageFields } from "./load-percentage-fields";
import { LoadUnspecifiedFields } from "./load-unspecified-fields";
import { LoadWithoutWeightFields } from "./load-without-weight-fields";
import { buildDefaultLoad } from "./weight-load-defaults";

const LOAD_KIND_LABELS: Record<LoadKind, string> = {
  absolute: "Exact weight",
  percentage: "Percentage",
  bodyweight: "Bodyweight",
  without_weight: "Without weight",
  unspecified: "Unspecified",
};

type LoadEditorProps = {
  value: Load;
  onChange: (next: Load) => void;
  error?: FieldErrors<Load> | undefined;
  disabled?: boolean;
};

export const LoadEditor = ({ value, onChange, error, disabled = false }: LoadEditorProps) => {
  const handleKindChange = (nextKind: LoadKind) => {
    onChange(buildDefaultLoad(nextKind));
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
      <FormControl size="small" sx={{ minWidth: 220 }} disabled={disabled}>
        <InputLabel>Load type</InputLabel>
        <Select
          value={value.kind}
          label="Load type"
          onChange={(e) => handleKindChange(e.target.value as LoadKind)}
        >
          {LOAD_KINDS.map((kind) => (
            <MenuItem key={kind} value={kind}>
              {LOAD_KIND_LABELS[kind]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {renderKind()}
    </Stack>
  );
};

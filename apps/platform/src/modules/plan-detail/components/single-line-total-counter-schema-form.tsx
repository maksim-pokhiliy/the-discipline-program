"use client";

import { useEffect } from "react";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Chip } from "@mui/material";

import { FormSection } from "@repo/ui";

import type { ParamsFor, SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";

type SingleLineTotalCounterParams = ParamsFor<"single-line-total-counter">;

const TOTAL_COUNTER_LABEL = "total counter mode (sum of reps)";

export const singleLineTotalCounterDefaultParams: SingleLineTotalCounterParams = {
  totalFlag: true,
};

export const toSingleLineTotalCounterParams = (
  _mode: SchemaEditorMode,
): SingleLineTotalCounterParams => singleLineTotalCounterDefaultParams;

export const SingleLineTotalCounterForm: React.FC<
  SchemaParamFormProps<SingleLineTotalCounterParams>
> = ({ value, onChange, disabled = false }) => {
  useEffect(() => {
    if (value.totalFlag !== true) {
      onChange(singleLineTotalCounterDefaultParams);
    }
  }, [value.totalFlag, onChange]);

  return (
    <FormSection label="Total counter" helper="no parameters — the counter is implicit">
      <Chip
        size="small"
        color="success"
        variant="outlined"
        icon={<CheckCircleOutlineIcon />}
        label={TOTAL_COUNTER_LABEL}
        disabled={disabled}
      />
    </FormSection>
  );
};

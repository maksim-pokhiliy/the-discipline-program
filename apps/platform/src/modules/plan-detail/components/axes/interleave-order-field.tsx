"use client";

import { type MouseEvent } from "react";

import { ToggleButton } from "@mui/material";

import {
  PARALLEL_INTERLEAVE_ORDERS,
  type ParallelInterleaveOrder,
} from "@repo/contracts/lms/composition";
import { LabeledToggleGroup } from "@repo/ui";

import { INTERLEAVE_ORDER_LABELS } from "../../lib/compose-axis-labels";

const LABEL = "interleave";

type InterleaveOrderFieldProps = {
  value: ParallelInterleaveOrder;
  onChange: (next: ParallelInterleaveOrder) => void;
};

export const InterleaveOrderField: React.FC<InterleaveOrderFieldProps> = ({ value, onChange }) => {
  const handleChange = (_: MouseEvent<HTMLElement>, next: ParallelInterleaveOrder | null): void => {
    if (next === null || next === value) {
      return;
    }

    onChange(next);
  };

  return (
    <LabeledToggleGroup label={LABEL} value={value} onChange={handleChange}>
      {PARALLEL_INTERLEAVE_ORDERS.map((order) => (
        <ToggleButton key={order} value={order}>
          {INTERLEAVE_ORDER_LABELS[order]}
        </ToggleButton>
      ))}
    </LabeledToggleGroup>
  );
};

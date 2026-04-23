"use client";

import { Chip } from "@mui/material";
import { NodeViewWrapper } from "@tiptap/react";

import { readPrescriptionChipAttrs, type PrescriptionChipNodeViewProps } from "./node-view-types";

const formatPrescriptionLabel = (
  kind: string,
  value: number | null,
  unit: string | null,
  label: string | null,
): string => {
  if (label !== null && label.length > 0) {
    return label;
  }

  if (kind === "PERCENT_OF_1RM" && value !== null) {
    return `@${value}%`;
  }

  if (kind === "RPE" && value !== null) {
    return `@RPE ${value}`;
  }

  if (kind === "KG" && value !== null) {
    return `@${value}${unit ?? "kg"}`;
  }

  if (kind === "NONE") {
    return "@scaled";
  }

  return "@";
};

export const PrescriptionChipView = ({ node, selected }: PrescriptionChipNodeViewProps) => {
  const { kind, value, unit, label } = readPrescriptionChipAttrs(node.attrs);
  const display = formatPrescriptionLabel(kind, value, unit, label);

  return (
    <NodeViewWrapper as="span" style={{ display: "inline-flex" }}>
      <Chip
        size="small"
        variant={selected ? "filled" : "outlined"}
        color="secondary"
        label={display}
        sx={{ mx: 0.25 }}
      />
    </NodeViewWrapper>
  );
};

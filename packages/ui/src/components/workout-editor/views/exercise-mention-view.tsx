"use client";

import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { Chip, Tooltip } from "@mui/material";
import { NodeViewWrapper } from "@tiptap/react";

import { readExerciseMentionAttrs, type ExerciseMentionNodeViewProps } from "./node-view-types";

const formatRepLabel = (sets: number | null, repValues: number[]): string | null => {
  if (repValues.length === 0) {
    return null;
  }

  const repsPart = repValues.join("-");

  if (sets !== null && sets > 0 && repValues.length === 1) {
    return `${sets}×${repsPart}`;
  }

  return repsPart;
};

export const ExerciseMentionView = ({ node, selected }: ExerciseMentionNodeViewProps) => {
  const { canonicalName, exerciseId, sets, repValues, note } = readExerciseMentionAttrs(node.attrs);
  const repLabel = formatRepLabel(sets, repValues);
  const label = canonicalName ?? "Unknown exercise";
  const fullLabel = repLabel ? `${label} · ${repLabel}` : label;
  const tooltipText = exerciseId === null ? "Unresolved exercise reference" : (note ?? label);

  return (
    <NodeViewWrapper as="span" style={{ display: "inline-flex" }}>
      <Tooltip title={tooltipText} arrow>
        <Chip
          size="small"
          variant={selected ? "filled" : "outlined"}
          icon={<FitnessCenterIcon fontSize="small" />}
          label={fullLabel}
          color={exerciseId === null ? "warning" : "default"}
          sx={{ mx: 0.25, cursor: "pointer" }}
        />
      </Tooltip>
    </NodeViewWrapper>
  );
};

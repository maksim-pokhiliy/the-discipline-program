"use client";

import { type MouseEvent } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Box, Stack, Typography } from "@mui/material";

import { DecorationBadge } from "./decoration-badge";
import { useEffectivePlanDecorationContext } from "./effective-plan-decoration-context";
import { getDecorationStyles } from "./get-decoration-styles";
import { type PlanCanvasSelectArgs } from "./plan-canvas";
import { planSelectionContains, type PlanSelection } from "./selection";
import { useTouchTargetSx } from "./use-touch-target-sx";

export type EntryRowProps = {
  setGroupId: string;
  entryId: string;
  exerciseName: string;
  selection: PlanSelection | null;
  onSelect: (args: PlanCanvasSelectArgs) => void;
};

const isAdditive = (event: MouseEvent): boolean => event.shiftKey || event.metaKey || event.ctrlKey;

export const EntryRow = ({ entryId, exerciseName, selection, onSelect }: EntryRowProps) => {
  const sortable = useSortable({ id: `entry:${entryId}`, data: { kind: "entry", entryId } });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
  };
  const isSelected = planSelectionContains(selection, "entry", entryId);
  const decoration = useEffectivePlanDecorationContext().getDecoration(entryId);
  const decorationStyles = getDecorationStyles(decoration);
  const touchTargetSx = useTouchTargetSx();

  return (
    <Stack
      ref={sortable.setNodeRef}
      style={style}
      direction="row"
      alignItems="center"
      spacing={0.5}
      onClick={(event) => onSelect({ kind: "entry", id: entryId, additive: isAdditive(event) })}
      sx={[
        {
          py: 0.5,
          pl: 1,
          borderRadius: 1,
          cursor: "pointer",
          bgcolor: isSelected ? "action.selected" : "transparent",
          outline: isSelected ? "2px solid" : "none",
          outlineColor: "primary.main",
          outlineOffset: "-2px",
          "&:hover": { bgcolor: "action.hover" },
        },
        touchTargetSx,
        ...(Array.isArray(decorationStyles.sx) ? decorationStyles.sx : [decorationStyles.sx]),
      ]}
    >
      <Box
        {...sortable.attributes}
        {...sortable.listeners}
        sx={{ cursor: "grab", display: "flex", color: "text.muted" }}
        aria-label="Drag entry"
      >
        <DragIndicatorIcon fontSize="inherit" />
      </Box>
      <Typography variant="caption" sx={{ flex: 1 }}>
        {exerciseName}
      </Typography>
      <DecorationBadge styles={decorationStyles} />
    </Stack>
  );
};

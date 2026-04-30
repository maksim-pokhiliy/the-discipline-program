"use client";

import { useDraggable } from "@dnd-kit/core";
import { Box, Typography } from "@mui/material";

import {
  type ExerciseSnapshot,
  type SchemeArchetypeKind,
  type SchemeParams,
} from "@repo/contracts/lms/_domain";

import { useTouchTargetSx } from "../plan-canvas/use-touch-target-sx";

export type LibraryDraggablePayload =
  | { kind: "exercise"; exerciseId: string; snapshot: ExerciseSnapshot }
  | { kind: "block-kind"; blockKindId: string; defaultWeight: number }
  | {
      kind: "scheme-template";
      schemeTemplateId: string;
      archetypeKind: SchemeArchetypeKind;
      defaultParams: SchemeParams;
    };

type LibraryListItemProps = {
  draggableId: string;
  payload: LibraryDraggablePayload;
  name: string;
  scope?: string;
};

export const LibraryListItem = ({ draggableId, payload, name, scope }: LibraryListItemProps) => {
  const touchTargetSx = useTouchTargetSx();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: draggableId,
    data: payload,
  });

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      sx={[
        {
          px: 1,
          py: 0.75,
          borderRadius: 1,
          cursor: isDragging ? "grabbing" : "grab",
          opacity: isDragging ? 0.5 : 1,
          "&:hover": { bgcolor: "action.hover" },
        },
        touchTargetSx,
      ]}
    >
      <Typography variant="body2" noWrap>
        {name}
      </Typography>
      {scope && (
        <Typography variant="caption" color="text.secondary">
          {scope}
        </Typography>
      )}
    </Box>
  );
};

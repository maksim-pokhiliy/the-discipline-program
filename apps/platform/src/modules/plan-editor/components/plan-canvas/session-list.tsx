"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Box, Stack, Typography } from "@mui/material";

import { type PlanStructureSession } from "@repo/contracts/lms/training-plan";

import { BlockTree } from "./block-tree";
import { type PlanSelection } from "./selection";

export type SessionListProps = {
  session: PlanStructureSession;
  selection: PlanSelection | null;
  onSelect: (selection: PlanSelection) => void;
};

export const SessionList = ({ session, selection, onSelect }: SessionListProps) => {
  const blockIds = session.blocks.map((b) => `block:${b.id}`);
  const droppable = useDroppable({
    id: `session:${session.id}`,
    data: { kind: "session", sessionId: session.id },
  });

  return (
    <Stack spacing={1}>
      <Typography variant="caption" color="text.secondary">
        {session.label ?? "Session"}
      </Typography>

      <Box
        ref={droppable.setNodeRef}
        sx={{
          minHeight: 32,
          borderRadius: 1,
          bgcolor: droppable.isOver ? "action.hover" : "transparent",
          transition: "background-color 0.15s",
        }}
      >
        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
          <Stack spacing={1}>
            {session.blocks.length === 0 ? (
              <Typography variant="caption" color="text.disabled" sx={{ p: 1 }}>
                Drop blocks here
              </Typography>
            ) : (
              session.blocks.map((block) => (
                <BlockTree key={block.id} block={block} selection={selection} onSelect={onSelect} />
              ))
            )}
          </Stack>
        </SortableContext>
      </Box>
    </Stack>
  );
};

"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Box, Stack, Typography } from "@mui/material";

import { type PlanStructureSession } from "@repo/contracts/lms/training-plan";

import { BlockTree } from "./block-tree";
import { DecorationBadge } from "./decoration-badge";
import { useEffectivePlanDecorationContext } from "./effective-plan-decoration-context";
import { getDecorationStyles } from "./get-decoration-styles";
import { type PlanCanvasSelectArgs } from "./plan-canvas";
import { type PlanSelection } from "./selection";

export type SessionListProps = {
  session: PlanStructureSession;
  selection: PlanSelection | null;
  onSelect: (args: PlanCanvasSelectArgs) => void;
};

export const SessionList = ({ session, selection, onSelect }: SessionListProps) => {
  const blockIds = session.blocks.map((b) => `block:${b.id}`);
  const droppable = useDroppable({
    id: `session:${session.id}`,
    data: { kind: "session", sessionId: session.id },
  });
  const decoration = useEffectivePlanDecorationContext().getDecoration(session.id);
  const decorationStyles = getDecorationStyles(decoration);

  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {session.label ?? "Session"}
        </Typography>
        <DecorationBadge styles={decorationStyles} />
      </Stack>

      <Box
        ref={droppable.setNodeRef}
        sx={[
          {
            minHeight: 32,
            borderRadius: 1,
            bgcolor: droppable.isOver ? "action.hover" : "transparent",
            transition: "background-color 0.15s",
          },
          ...(Array.isArray(decorationStyles.sx) ? decorationStyles.sx : [decorationStyles.sx]),
        ]}
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

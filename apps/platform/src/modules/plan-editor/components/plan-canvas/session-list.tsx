"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, ListItemIcon, ListItemText, MenuItem, Stack, Typography } from "@mui/material";

import { type PlanStructureSession } from "@repo/contracts/lms/training-plan";

import { usePlanBulkPatch } from "@app/lib/hooks";

import { BlockTree } from "./block-tree";
import { countSessionEntities, isContainerEmpty } from "./count-nested-entities";
import { DecorationBadge } from "./decoration-badge";
import { DeleteEntityDialog } from "./delete-entity-dialog";
import { useEffectivePlanDecorationContext } from "./effective-plan-decoration-context";
import { getDecorationStyles } from "./get-decoration-styles";
import { buildDeleteSession, buildOptimisticDeleteSession } from "./op-builders";
import { type PlanCanvasSelectArgs } from "./plan-canvas";
import { RowActionMenu } from "./row-action-menu";
import { type PlanSelection } from "./selection";
import { useDeleteEntityDialog } from "./use-delete-entity-dialog";

export type SessionListProps = {
  session: PlanStructureSession;
  planId: string;
  selection: PlanSelection | null;
  onSelect: (args: PlanCanvasSelectArgs) => void;
};

export const SessionList = ({ session, planId, selection, onSelect }: SessionListProps) => {
  const blockIds = session.blocks.map((b) => `block:${b.id}`);
  const droppable = useDroppable({
    id: `session:${session.id}`,
    data: { kind: "session", sessionId: session.id },
  });
  const decoration = useEffectivePlanDecorationContext().getDecoration(session.id);
  const decorationStyles = getDecorationStyles(decoration);
  const bulkPatch = usePlanBulkPatch(planId);
  const dialog = useDeleteEntityDialog();
  const counts = countSessionEntities(session);
  const sessionLabel = session.label ?? "Session";

  const handleConfirm = async () => {
    const op = buildDeleteSession({ sessionId: session.id, expectedVersion: session.version });
    const optimisticPatch = isContainerEmpty(counts)
      ? buildOptimisticDeleteSession(session.id)
      : undefined;

    try {
      await bulkPatch.mutateAsync({ ops: [op], ...(optimisticPatch ? { optimisticPatch } : {}) });
      dialog.close();
    } catch {
      return;
    }
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {sessionLabel}
        </Typography>
        <DecorationBadge styles={decorationStyles} />
        <RowActionMenu ariaLabel={`${sessionLabel} actions`}>
          {(close) => (
            <MenuItem
              onClick={() => {
                close();
                dialog.open();
              }}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete session</ListItemText>
            </MenuItem>
          )}
        </RowActionMenu>
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
              <Typography variant="caption" color="text.muted" sx={{ p: 1 }}>
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

      <DeleteEntityDialog
        isOpen={dialog.isOpen}
        onClose={dialog.close}
        onConfirm={() => {
          void handleConfirm();
        }}
        entityKind="session"
        entityLabel={sessionLabel}
        counts={counts}
        isPending={bulkPatch.isPending}
      />
    </Stack>
  );
};

"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Box, Stack, Typography } from "@mui/material";

import { type PlanStructureSetGroup } from "@repo/contracts/lms/training-plan";

import { EntryRow } from "./entry-row";
import { type PlanCanvasSelectArgs } from "./plan-canvas";
import { type PlanSelection } from "./selection";

export type SetGroupGroupProps = {
  setGroup: PlanStructureSetGroup;
  selection: PlanSelection | null;
  onSelect: (args: PlanCanvasSelectArgs) => void;
};

export const SetGroupGroup = ({ setGroup, selection, onSelect }: SetGroupGroupProps) => {
  const entryIds = setGroup.entries.map((entry) => `entry:${entry.id}`);
  const droppable = useDroppable({
    id: `setGroup:${setGroup.id}`,
    data: { kind: "setGroup", setGroupId: setGroup.id },
  });

  return (
    <Stack spacing={0.25} sx={{ pl: 2 }}>
      <Typography variant="caption" color="text.secondary">
        SetGroup ×{setGroup.entries.length}
      </Typography>
      <Box
        ref={droppable.setNodeRef}
        sx={{
          minHeight: 24,
          borderRadius: 1,
          bgcolor: droppable.isOver ? "action.hover" : "transparent",
          transition: "background-color 0.15s",
        }}
      >
        <SortableContext items={entryIds} strategy={verticalListSortingStrategy}>
          {setGroup.entries.map((entry) => (
            <EntryRow
              key={entry.id}
              setGroupId={setGroup.id}
              entryId={entry.id}
              exerciseName={entry.exerciseSnapshot.name}
              selection={selection}
              onSelect={onSelect}
            />
          ))}
        </SortableContext>
      </Box>
    </Stack>
  );
};

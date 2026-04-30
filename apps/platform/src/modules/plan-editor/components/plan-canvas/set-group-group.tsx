"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Stack, Typography } from "@mui/material";

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

  return (
    <Stack spacing={0.25} sx={{ pl: 2 }}>
      <Typography variant="caption" color="text.secondary">
        SetGroup ×{setGroup.entries.length}
      </Typography>
      <SortableContext items={entryIds} strategy={verticalListSortingStrategy}>
        {setGroup.entries.map((entry) => {
          const exerciseName = (() => {
            const snapshot = entry.exerciseSnapshot;

            if (
              snapshot &&
              typeof snapshot === "object" &&
              "name" in snapshot &&
              typeof (snapshot as { name?: unknown }).name === "string"
            ) {
              return (snapshot as { name: string }).name;
            }

            return "Exercise";
          })();

          return (
            <EntryRow
              key={entry.id}
              setGroupId={setGroup.id}
              entryId={entry.id}
              exerciseName={exerciseName}
              selection={selection}
              onSelect={onSelect}
            />
          );
        })}
      </SortableContext>
    </Stack>
  );
};

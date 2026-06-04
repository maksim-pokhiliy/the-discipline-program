"use client";

import { Stack } from "@mui/material";

import type { Exercise } from "@repo/contracts/lms/exercise";

import type { ComposeProgram, NodeId } from "../compose-tree.types";

import type { NodeHandlers } from "./compose-canvas-handlers";
import type { UpperHandlers } from "./compose-upper-handlers";
import { ComposeWeekRow } from "./compose-week-row";

const WEEKS_SPACING = 4;

type ComposeCanvasProps = {
  program: ComposeProgram;
  exerciseById: Map<string, Exercise>;
  handlers: NodeHandlers;
  upperHandlers: UpperHandlers;
  onRename: (id: NodeId, header: string) => void;
};

export const ComposeCanvas: React.FC<ComposeCanvasProps> = ({
  program,
  exerciseById,
  handlers,
  upperHandlers,
  onRename,
}) => (
  <Stack direction="column" spacing={WEEKS_SPACING}>
    {program.weeks.map((week) => (
      <ComposeWeekRow
        key={week.id}
        week={week}
        exerciseById={exerciseById}
        handlers={handlers}
        upperHandlers={upperHandlers}
        onRename={onRename}
      />
    ))}
  </Stack>
);

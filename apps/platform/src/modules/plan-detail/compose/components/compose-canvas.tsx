"use client";

import { useMemo } from "react";

import { Stack } from "@mui/material";

import { MOCK_EXERCISES } from "../compose-mock-exercises";
import type { ComposeProgram, NodeId } from "../compose-tree.types";

import type { NodeHandlers } from "./compose-canvas-handlers";
import type { UpperHandlers } from "./compose-upper-handlers";
import { ComposeWeekRow } from "./compose-week-row";

const WEEKS_SPACING = 4;

type ComposeCanvasProps = {
  program: ComposeProgram;
  handlers: NodeHandlers;
  upperHandlers: UpperHandlers;
  onRename: (id: NodeId, header: string) => void;
};

export const ComposeCanvas: React.FC<ComposeCanvasProps> = ({
  program,
  handlers,
  upperHandlers,
  onRename,
}) => {
  const exerciseById = useMemo(
    () => new Map(MOCK_EXERCISES.map((exercise) => [exercise.id, exercise])),
    [],
  );

  return (
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
};

"use client";

import { Stack } from "@mui/material";

import type { Exercise } from "@repo/contracts/lms/exercise";

import type { ComposeWeek, NodeId } from "../compose-tree.types";

import type { NodeHandlers } from "./compose-canvas-handlers";
import { ComposeDayRow } from "./compose-day-row";
import type { UpperHandlers } from "./compose-upper-handlers";
import { ComposeUpperRowHead } from "./compose-upper-row-head";

const WEEK_SPACING = 2.5;
const DAYS_SPACING = 3;
const DUPLICATE_ARIA = "Duplicate week";

type ComposeWeekRowProps = {
  week: ComposeWeek;
  exerciseById: Map<string, Exercise>;
  handlers: NodeHandlers;
  upperHandlers: UpperHandlers;
  onRename: (id: NodeId, header: string) => void;
};

export const ComposeWeekRow: React.FC<ComposeWeekRowProps> = ({
  week,
  exerciseById,
  handlers,
  upperHandlers,
  onRename,
}) => (
  <Stack direction="column" spacing={WEEK_SPACING}>
    <ComposeUpperRowHead
      label={week.label}
      variant="h5"
      duplicateAria={DUPLICATE_ARIA}
      isStructuralEditingAllowed={upperHandlers.isStructuralEditingAllowed}
      onDuplicate={() => upperHandlers.onDuplicateWeek(week.id)}
    />

    <Stack direction="column" spacing={DAYS_SPACING}>
      {week.days.map((day) => (
        <ComposeDayRow
          key={day.id}
          day={day}
          exerciseById={exerciseById}
          handlers={handlers}
          upperHandlers={upperHandlers}
          onRename={onRename}
        />
      ))}
    </Stack>
  </Stack>
);

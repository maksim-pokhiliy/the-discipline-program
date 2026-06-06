"use client";

import { Stack } from "@mui/material";

import type { Exercise } from "@repo/contracts/lms/exercise";

import type { ComposeDay, NodeId } from "../compose-tree.types";

import type { NodeHandlers } from "./compose-canvas-handlers";
import { ComposeSessionRow } from "./compose-session-row";
import type { UpperHandlers } from "./compose-upper-handlers";
import { ComposeUpperRowHead } from "./compose-upper-row-head";

const DAY_SPACING = 2;
const SESSIONS_SPACING = 2.5;
const DUPLICATE_ARIA = "Duplicate day";

type ComposeDayRowProps = {
  day: ComposeDay;
  exerciseById: Map<string, Exercise>;
  handlers: NodeHandlers;
  upperHandlers: UpperHandlers;
  onRename: (id: NodeId, header: string) => void;
};

export const ComposeDayRow: React.FC<ComposeDayRowProps> = ({
  day,
  exerciseById,
  handlers,
  upperHandlers,
  onRename,
}) => (
  <Stack direction="column" spacing={DAY_SPACING}>
    <ComposeUpperRowHead
      label={day.label}
      variant="h6"
      duplicateAria={DUPLICATE_ARIA}
      isStructuralEditingAllowed={upperHandlers.isStructuralEditingAllowed}
      onDuplicate={() => upperHandlers.onDuplicateDay(day.id)}
    />

    <Stack direction="column" spacing={SESSIONS_SPACING}>
      {day.sessions.map((session) => (
        <ComposeSessionRow
          key={session.id}
          session={session}
          exerciseById={exerciseById}
          handlers={handlers}
          upperHandlers={upperHandlers}
          onRename={onRename}
        />
      ))}
    </Stack>
  </Stack>
);

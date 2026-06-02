"use client";

import { Stack } from "@mui/material";

import type { Exercise } from "@repo/contracts/lms/exercise";

import type { ComposeSession, NodeId } from "../compose-tree.types";

import { ComposeBlockRow } from "./compose-block-row";
import type { NodeHandlers } from "./compose-canvas-handlers";
import type { UpperHandlers } from "./compose-upper-handlers";
import { ComposeUpperRowHead } from "./compose-upper-row-head";

const SESSION_SPACING = 1.5;
const BLOCKS_SPACING = 2;
const DUPLICATE_ARIA = "Duplicate session";

type ComposeSessionRowProps = {
  session: ComposeSession;
  exerciseById: Map<string, Exercise>;
  handlers: NodeHandlers;
  upperHandlers: UpperHandlers;
  onRename: (id: NodeId, header: string) => void;
};

export const ComposeSessionRow: React.FC<ComposeSessionRowProps> = ({
  session,
  exerciseById,
  handlers,
  upperHandlers,
  onRename,
}) => (
  <Stack direction="column" spacing={SESSION_SPACING}>
    <ComposeUpperRowHead
      label={session.label}
      variant="subtitle1"
      duplicateAria={DUPLICATE_ARIA}
      onDuplicate={() => upperHandlers.onDuplicateSession(session.id)}
    />

    <Stack direction="column" spacing={BLOCKS_SPACING}>
      {session.blocks.map((block) => (
        <ComposeBlockRow
          key={block.id}
          block={block}
          exerciseById={exerciseById}
          handlers={handlers}
          onRename={onRename}
          onDuplicateBlock={upperHandlers.onDuplicateBlock}
        />
      ))}
    </Stack>
  </Stack>
);

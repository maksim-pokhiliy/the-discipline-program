"use client";

import { Stack } from "@mui/material";

import type { Exercise } from "@repo/contracts/lms/exercise";

import type { ComposeBlock, NodeId } from "../compose-tree.types";

import type { NodeHandlers } from "./compose-canvas-handlers";
import { ComposeContainerCard } from "./compose-container-card";
import { ComposeUpperRowHead } from "./compose-upper-row-head";

const BLOCK_SPACING = 1;
const DUPLICATE_ARIA = "Duplicate block";

type ComposeBlockRowProps = {
  block: ComposeBlock;
  exerciseById: Map<string, Exercise>;
  handlers: NodeHandlers;
  onRename: (id: NodeId, header: string) => void;
  onDuplicateBlock: (id: NodeId) => void;
};

export const ComposeBlockRow: React.FC<ComposeBlockRowProps> = ({
  block,
  exerciseById,
  handlers,
  onRename,
  onDuplicateBlock,
}) => (
  <Stack direction="column" spacing={BLOCK_SPACING}>
    <ComposeUpperRowHead
      label={block.label}
      variant="subtitle2"
      duplicateAria={DUPLICATE_ARIA}
      onDuplicate={() => onDuplicateBlock(block.id)}
    />

    <ComposeContainerCard
      container={block.root}
      exerciseById={exerciseById}
      handlers={handlers}
      onRename={onRename}
      isRoot
    />
  </Stack>
);

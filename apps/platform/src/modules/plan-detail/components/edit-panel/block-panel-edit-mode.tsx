"use client";

import { type BlockType } from "@repo/contracts/lms/block-type";
import { type Exercise } from "@repo/contracts/lms/exercise";
import { type PlanBlock } from "@repo/contracts/lms/plan-block";
import { type SchemeType } from "@repo/contracts/lms/scheme-type";

import { useItemsByBlock } from "@app/lib/hooks";

import { BlockEditPanel } from "./block-edit-panel";
import { type SaveStatusChange } from "./edit-panel-status";

type BlockEditModeLookups = {
  readonly schemeTypes: ReadonlyMap<string, SchemeType>;
  readonly blockTypes: ReadonlyMap<string, BlockType>;
  readonly exercises: ReadonlyMap<string, Exercise>;
};

type BlockPanelEditModeProps = {
  planId: string;
  sessionId: string;
  blockId: string;
  existingBlock: PlanBlock | null;
  existingBlocks: readonly PlanBlock[];
  lookups: BlockEditModeLookups;
  onClose: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  onStatusChange: SaveStatusChange;
};

export const BlockPanelEditMode: React.FC<BlockPanelEditModeProps> = ({
  planId,
  sessionId,
  blockId,
  existingBlock,
  existingBlocks,
  lookups,
  onClose,
  onDirtyChange,
  onStatusChange,
}) => {
  const itemsQuery = useItemsByBlock(planId, blockId);
  const items = itemsQuery.data?.items ?? [];

  return (
    <BlockEditPanel
      planId={planId}
      sessionId={sessionId}
      blockId={blockId}
      existingBlock={existingBlock}
      existingBlocks={existingBlocks}
      existingItems={items}
      lookups={lookups}
      onClose={onClose}
      onDirtyChange={onDirtyChange}
      onStatusChange={onStatusChange}
    />
  );
};

"use client";

import { type BlockType } from "@repo/contracts/lms/block-type";
import { type Exercise } from "@repo/contracts/lms/exercise";
import { type PlanBlock } from "@repo/contracts/lms/plan-block";
import { type SchemeType } from "@repo/contracts/lms/scheme-type";
import { LoadingState } from "@repo/ui";

import { useItemsByBlock } from "@app/lib/hooks";

import { BlockEditPanel } from "./block-edit-panel";
import { EditPanel } from "./edit-panel";
import { type SaveStatusChange } from "./edit-panel-status";

const ITEMS_LOADING_MESSAGE = "Loading block items...";
const LOADING_TITLE = "Loading block";

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
  onStatusChange,
}) => {
  const itemsQuery = useItemsByBlock(planId, blockId);

  if (itemsQuery.data === undefined) {
    return (
      <EditPanel
        open
        onClose={onClose}
        title={LOADING_TITLE}
        isSaving={false}
        canSave={false}
        onSave={() => undefined}
        onCancel={onClose}
      >
        <LoadingState message={ITEMS_LOADING_MESSAGE} />
      </EditPanel>
    );
  }

  return (
    <BlockEditPanel
      planId={planId}
      sessionId={sessionId}
      blockId={blockId}
      existingBlock={existingBlock}
      existingBlocks={existingBlocks}
      existingItems={itemsQuery.data.items}
      lookups={lookups}
      onClose={onClose}
      onStatusChange={onStatusChange}
    />
  );
};

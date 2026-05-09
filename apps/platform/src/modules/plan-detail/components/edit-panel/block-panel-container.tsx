"use client";

import { type BlockType } from "@repo/contracts/lms/block-type";
import { type Exercise } from "@repo/contracts/lms/exercise";
import { type SchemeType } from "@repo/contracts/lms/scheme-type";

import { useBlocksBySession } from "@app/lib/hooks";

import { type OpenPanel } from "../../lib/use-edit-panel-state";

import { BlockEditPanel } from "./block-edit-panel";
import { BlockPanelEditMode } from "./block-panel-edit-mode";
import { type SaveStatusChange } from "./edit-panel-status";

type BlockPanel = Extract<OpenPanel, { kind: "block" }>;

type BlockPanelLookups = {
  readonly schemeTypes: ReadonlyMap<string, SchemeType>;
  readonly blockTypes: ReadonlyMap<string, BlockType>;
  readonly exercises: ReadonlyMap<string, Exercise>;
};

type BlockPanelContainerProps = {
  planId: string;
  panel: BlockPanel;
  lookups: BlockPanelLookups;
  onClose: () => void;
  onStatusChange: SaveStatusChange;
};

export const BlockPanelContainer: React.FC<BlockPanelContainerProps> = ({
  planId,
  panel,
  lookups,
  onClose,
  onStatusChange,
}) => {
  const blocksQuery = useBlocksBySession(planId, panel.sessionId);
  const blocks = blocksQuery.data?.blocks ?? [];
  const existingBlock = blocks.find((block) => block.id === panel.blockId) ?? null;

  if (panel.blockId === null) {
    return (
      <BlockEditPanel
        planId={planId}
        sessionId={panel.sessionId}
        blockId={null}
        existingBlock={null}
        existingBlocks={blocks}
        existingItems={[]}
        lookups={lookups}
        onClose={onClose}
        onStatusChange={onStatusChange}
      />
    );
  }

  return (
    <BlockPanelEditMode
      planId={planId}
      sessionId={panel.sessionId}
      blockId={panel.blockId}
      existingBlock={existingBlock}
      existingBlocks={blocks}
      lookups={lookups}
      onClose={onClose}
      onStatusChange={onStatusChange}
    />
  );
};

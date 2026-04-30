import { toast } from "sonner";

import { type BlockKind } from "@repo/contracts/lms/block-kind";
import { type PlanStructureBlock } from "@repo/contracts/lms/training-plan";

import { type CommandPaletteCommand } from "../command-palette.context";

export type ChangeBlockKindCommandOptions = {
  block: PlanStructureBlock | null;
  blockKinds: readonly BlockKind[];
  promptForKind: (block: PlanStructureBlock, kinds: readonly BlockKind[]) => BlockKind | null;
  applyKind: (block: PlanStructureBlock, kind: BlockKind) => Promise<void> | void;
};

export const promptForBlockKindFromWindow = (
  block: PlanStructureBlock,
  kinds: readonly BlockKind[],
): BlockKind | null => {
  if (typeof window === "undefined" || kinds.length === 0) {
    return null;
  }

  const list = kinds.map((kind, index) => `${(index + 1).toString()}. ${kind.name}`).join("\n");
  const raw = window.prompt(
    `Block "${block.title ?? "(untitled)"}" — select new block kind by number:\n${list}`,
  );

  if (raw === null) {
    return null;
  }

  const choice = Number.parseInt(raw.trim(), 10);

  if (!Number.isFinite(choice)) {
    return null;
  }

  const index = choice - 1;

  return kinds[index] ?? null;
};

export const createChangeBlockKindCommand = (
  options: ChangeBlockKindCommandOptions,
): CommandPaletteCommand => {
  const { block, blockKinds, promptForKind, applyKind } = options;

  return {
    id: "plan.change-block-kind",
    title: "Change block kind of selected block",
    hint: block ? `Selected: ${block.title ?? "(untitled)"}` : "Select a block first",
    group: "Block",
    keywords: ["kind", "category"],
    perform: async () => {
      if (!block) {
        toast.error("Select a block first to change its kind");

        return;
      }

      if (blockKinds.length === 0) {
        toast.error("No block kinds available");

        return;
      }

      const next = promptForKind(block, blockKinds);

      if (!next) {
        return;
      }

      await applyKind(block, next);
    },
  };
};

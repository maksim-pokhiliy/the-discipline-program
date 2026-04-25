import type { BlockType } from "@repo/contracts/library/block-type";

import type { AddBlockSlashItem, SlashCommandItem } from "./slash-items-types";

const matches = (query: string, value: string): boolean =>
  query.length === 0 || value.toLowerCase().includes(query);

export const buildSlashItemsDoc = (
  query: string,
  blockTypes: ReadonlyArray<BlockType>,
): SlashCommandItem[] => {
  const normalized = query.trim().toLowerCase();

  return blockTypes
    .filter(
      (bt) =>
        matches(normalized, bt.name) ||
        matches(normalized, bt.slug) ||
        (bt.description !== null && matches(normalized, bt.description)),
    )
    .map<AddBlockSlashItem>((bt) => ({
      kind: "add-block",
      id: `add-block-${bt.id}`,
      blockTypeId: bt.id,
      blockTypeSlug: bt.slug,
      label: bt.name,
      description: bt.description ?? undefined,
    }));
};

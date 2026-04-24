import type { BlockType } from "@repo/contracts/library/block-type";

import { BLOCK_COMMAND_DESCRIPTIONS, BLOCK_COMMAND_LABELS } from "./constants";
import type { SchemeSuggestion, SlashCommandItem, WorkoutEditorProps } from "./types";

export type SlashContext = {
  blockTypes: ReadonlyArray<BlockType>;
  schemes: SchemeSuggestion[];
};

const NOTES_SLUG = "notes";
const TEXT_CALLOUT_SLUG = "text-callout";

const pickDefaultBlockTypeId = (
  blockName: string,
  blockTypes: ReadonlyArray<BlockType>,
): string | null => {
  if (blockName === "notes") {
    return blockTypes.find((bt) => bt.slug === NOTES_SLUG)?.id ?? null;
  }

  if (blockName === "textCallout") {
    return blockTypes.find((bt) => bt.slug === TEXT_CALLOUT_SLUG)?.id ?? null;
  }

  return blockTypes[0]?.id ?? null;
};

export const buildSlashItems = (
  query: string,
  ctx: SlashContext,
  props: WorkoutEditorProps,
): SlashCommandItem[] => {
  const normalized = query.trim().toLowerCase();
  const blockTypes = ctx.blockTypes;
  const schemes = ctx.schemes;
  const items: SlashCommandItem[] = [];

  const blockNames = Object.keys(BLOCK_COMMAND_LABELS) as Array<keyof typeof BLOCK_COMMAND_LABELS>;

  blockNames.forEach((blockName) => {
    const label = BLOCK_COMMAND_LABELS[blockName];
    const description = BLOCK_COMMAND_DESCRIPTIONS[blockName];

    if (normalized.length > 0 && !label.toLowerCase().includes(normalized)) {
      return;
    }

    const defaultBlockTypeId = pickDefaultBlockTypeId(blockName, blockTypes);

    const matchingScheme = schemes.find((scheme) => {
      if (blockName === "straightSets") {
        return scheme.kind === "STRAIGHT_SETS";
      }

      if (blockName === "forTime") {
        return scheme.kind === "FOR_TIME";
      }

      if (blockName === "amrap") {
        return scheme.kind === "AMRAP";
      }

      if (blockName === "emom") {
        return scheme.kind === "EMOM";
      }

      if (blockName === "everyXMin") {
        return scheme.kind === "EVERY_X_MIN";
      }

      if (blockName === "intervals") {
        return scheme.kind === "INTERVALS";
      }

      if (blockName === "timeBlocks") {
        return scheme.kind === "TIME_BLOCKS";
      }

      return false;
    });

    items.push({
      id: `block-${blockName}`,
      kind: blockName,
      label,
      description,
      blockNodeName: blockName,
      blockTypeId: defaultBlockTypeId ?? undefined,
      schemeId: matchingScheme?.id ?? null,
      schemeKind: matchingScheme?.kind ?? null,
      schemeConfig: matchingScheme?.paramDefaults ?? {},
    });
  });

  const blockTemplates = props.savedBlockTemplates ?? [];

  blockTemplates.forEach((tpl) => {
    if (normalized.length > 0 && !tpl.label.toLowerCase().includes(normalized)) {
      return;
    }

    items.push({
      id: `block-tpl-${tpl.id}`,
      kind: "blockTemplate",
      label: tpl.label,
      description: tpl.description,
      templateDoc: tpl.doc,
    });
  });

  const workoutTemplates = props.savedWorkoutTemplates ?? [];

  workoutTemplates.forEach((tpl) => {
    if (normalized.length > 0 && !tpl.label.toLowerCase().includes(normalized)) {
      return;
    }

    items.push({
      id: `workout-tpl-${tpl.id}`,
      kind: "workoutTemplate",
      label: tpl.label,
      description: tpl.description,
      templateDoc: tpl.doc,
    });
  });

  return items;
};

import { BLOCK_NODE_TYPES, type BlockNodeType } from "@repo/contracts/common/tiptap-doc";

export const WORKOUT_EDITOR_UPDATE_THROTTLE_MS = 150;

export const WORKOUT_EDITOR_MAX_DOC_BYTES = 500_000;

export const MENTION_TRIGGER_CHAR = "@";
export const SLASH_TRIGGER_CHAR = "/";

export const MIN_MENTION_QUERY_LENGTH_FOR_CREATE = 3;

export const BLOCK_NODE_NAMES = BLOCK_NODE_TYPES;

export type BlockNodeName = BlockNodeType;

export const EMOM_SLOT_NODE_NAME = "emomSlot" as const;
export const EXERCISE_MENTION_NODE_NAME = "exerciseMention" as const;
export const SCHEME_MENTION_NODE_NAME = "schemeMention" as const;
export const PRESCRIPTION_CHIP_NODE_NAME = "prescriptionChip" as const;

export const BLOCK_NODE_GROUP = "block";
export const INLINE_MENTION_GROUP = "inlineMention";
export const BLOCK_CONTENT_GROUP = "blockContent";

export const BLOCK_COMMAND_LABELS: Record<BlockNodeName, string> = {
  straightSets: "Straight sets",
  forTime: "For time",
  amrap: "AMRAP",
  emom: "EMOM",
  everyXMin: "Every X min",
  intervals: "Intervals",
  timeBlocks: "Time blocks",
  notes: "Notes",
  textCallout: "Text callout",
};

export const BLOCK_COMMAND_DESCRIPTIONS: Record<BlockNodeName, string> = {
  straightSets: "Sets × reps with load / effort",
  forTime: "Round-chipper against the clock",
  amrap: "As many rounds/reps as possible",
  emom: "Every minute on the minute",
  everyXMin: "Work every N minutes",
  intervals: "Work/rest interval rounds",
  timeBlocks: "Time-boxed sub-blocks",
  notes: "Free-form coach note",
  textCallout: "Short highlight / warning",
};

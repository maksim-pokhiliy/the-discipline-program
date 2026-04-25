export const WORKOUT_EDITOR_UPDATE_THROTTLE_MS = 150;

export const WORKOUT_EDITOR_MAX_DOC_BYTES = 500_000;

export const MENTION_TRIGGER_CHAR = "@";
export const SLASH_TRIGGER_CHAR = "/";

export const MIN_MENTION_QUERY_LENGTH_FOR_CREATE = 3;

export const BLOCK_NODE_NAME = "block" as const;
export const SCHEME_SECTION_NODE_NAME = "schemeSection" as const;
export const NOTES_SECTION_NODE_NAME = "notesSection" as const;
export const TEXT_CALLOUT_SECTION_NODE_NAME = "textCalloutSection" as const;
export const EXERCISE_LINE_NODE_NAME = "exerciseLine" as const;
export const EMOM_SLOT_NODE_NAME = "emomSlot" as const;
export const EXERCISE_MENTION_NODE_NAME = "exerciseMention" as const;
export const PRESCRIPTION_CHIP_NODE_NAME = "prescriptionChip" as const;

export const BLOCK_NODE_GROUP = "block" as const;
export const SECTION_NODE_GROUP = "section" as const;
export const INLINE_MENTION_GROUP = "inlineMention" as const;
export const BLOCK_CONTENT_GROUP = "blockContent" as const;

export const SECTION_NODE_NAMES = [
  SCHEME_SECTION_NODE_NAME,
  NOTES_SECTION_NODE_NAME,
  TEXT_CALLOUT_SECTION_NODE_NAME,
] as const;

export type SectionNodeName = (typeof SECTION_NODE_NAMES)[number];

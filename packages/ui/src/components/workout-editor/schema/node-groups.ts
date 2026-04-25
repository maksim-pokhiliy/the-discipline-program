export const BLOCK_NODE_GROUP = "block" as const;
export const SECTION_NODE_GROUP = "section" as const;
export const INLINE_MENTION_GROUP = "inlineMention" as const;
export const BLOCK_CONTENT_GROUP = "blockContent" as const;
export const EMOM_CHILD_GROUP = "emomSlot" as const;

export const BLOCK_WRAPPER_NODE_NAME = "block" as const;

export const SECTION_NODE_NAMES = ["schemeSection", "notesSection", "textCalloutSection"] as const;
export type SectionNodeName = (typeof SECTION_NODE_NAMES)[number];

export const INLINE_MENTION_NAMES = ["exerciseMention", "prescriptionChip"] as const;
export type InlineMentionName = (typeof INLINE_MENTION_NAMES)[number];

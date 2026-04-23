import { Node, type Attribute } from "@tiptap/core";

import { EXERCISE_MENTION_NODE_NAME, INLINE_MENTION_GROUP } from "../constants";

const nullable: Attribute = { default: null };
const emptyArray: Attribute = { default: [] as number[] };
const zero: Attribute = { default: 0 };

export const ExerciseMentionNode = Node.create({
  name: EXERCISE_MENTION_NODE_NAME,
  group: INLINE_MENTION_GROUP,
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes: () => ({
    exerciseId: nullable,
    canonicalName: nullable,
    repScheme: nullable,
    repValues: emptyArray,
    sets: nullable,
    prescription: nullable,
    restSec: nullable,
    note: nullable,
    complexGroup: nullable,
    complexOrder: nullable,
    sortOrder: zero,
    emomSlotId: nullable,
  }),
  parseHTML: () => [{ tag: "span[data-exercise-mention]" }],
  renderHTML: ({ HTMLAttributes }) => ["span", { ...HTMLAttributes, "data-exercise-mention": "" }],
});

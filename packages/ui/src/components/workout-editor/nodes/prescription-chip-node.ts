import { Node, type Attribute } from "@tiptap/core";

import { INLINE_MENTION_GROUP, PRESCRIPTION_CHIP_NODE_NAME } from "../constants";

const nullable: Attribute = { default: null };
const defaultKind: Attribute = { default: "PERCENT_OF_1RM" };

export const PrescriptionChipNode = Node.create({
  name: PRESCRIPTION_CHIP_NODE_NAME,
  group: INLINE_MENTION_GROUP,
  inline: true,
  atom: true,
  selectable: true,
  addAttributes: () => ({
    kind: defaultKind,
    value: nullable,
    unit: nullable,
    ofExerciseId: nullable,
    label: nullable,
  }),
  parseHTML: () => [{ tag: "span[data-prescription-chip]" }],
  renderHTML: ({ HTMLAttributes }) => ["span", { ...HTMLAttributes, "data-prescription-chip": "" }],
});

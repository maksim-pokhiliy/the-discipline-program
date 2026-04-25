import { Node, type Attribute } from "@tiptap/core";

import { BLOCK_NODE_GROUP, BLOCK_WRAPPER_NODE_NAME } from "../schema/node-groups";

const stringNull: Attribute = { default: null };
const zero: Attribute = { default: 0 };

export interface BlockWrapperAttrs {
  blockTypeId: string | null;
  title: string | null;
  sortOrder: number;
}

export const BlockWrapperNode = Node.create({
  name: BLOCK_WRAPPER_NODE_NAME,
  group: BLOCK_NODE_GROUP,
  content: "section*",
  defining: true,
  isolating: true,
  selectable: true,
  draggable: false,
  addAttributes: () => ({
    blockTypeId: stringNull,
    title: stringNull,
    sortOrder: zero,
  }),
  parseHTML: () => [{ tag: "section[data-workout-block]" }],
  renderHTML: ({ HTMLAttributes }) => [
    "section",
    { ...HTMLAttributes, "data-workout-block": "" },
    0,
  ],
});

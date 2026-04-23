import { Node } from "@tiptap/core";

import { BLOCK_GROUP_VALUE, buildFullBlockAttributes } from "./block-node-attrs";

export const EmomNode = Node.create({
  name: "emom",
  group: BLOCK_GROUP_VALUE,
  content: "emomSlot+",
  defining: true,
  isolating: true,
  selectable: true,
  addAttributes: () => buildFullBlockAttributes(),
  parseHTML: () => [{ tag: 'section[data-block-kind="emom"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "section",
    { ...HTMLAttributes, "data-block-kind": "emom" },
    0,
  ],
});

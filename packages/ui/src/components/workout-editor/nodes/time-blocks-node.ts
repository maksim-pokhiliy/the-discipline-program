import { Node } from "@tiptap/core";

import { BLOCK_GROUP_VALUE, buildFullBlockAttributes } from "./block-node-attrs";

export const TimeBlocksNode = Node.create({
  name: "timeBlocks",
  group: BLOCK_GROUP_VALUE,
  content: "exerciseMention*",
  defining: true,
  isolating: true,
  selectable: true,
  addAttributes: () => buildFullBlockAttributes(),
  parseHTML: () => [{ tag: 'section[data-block-kind="timeBlocks"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "section",
    { ...HTMLAttributes, "data-block-kind": "timeBlocks" },
    0,
  ],
});

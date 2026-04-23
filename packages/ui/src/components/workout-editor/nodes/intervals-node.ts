import { Node } from "@tiptap/core";

import { BLOCK_GROUP_VALUE, buildFullBlockAttributes } from "./block-node-attrs";

export const IntervalsNode = Node.create({
  name: "intervals",
  group: BLOCK_GROUP_VALUE,
  content: "exerciseMention*",
  defining: true,
  isolating: true,
  selectable: true,
  addAttributes: () => buildFullBlockAttributes(),
  parseHTML: () => [{ tag: 'section[data-block-kind="intervals"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "section",
    { ...HTMLAttributes, "data-block-kind": "intervals" },
    0,
  ],
});

import { Node } from "@tiptap/core";

import { BLOCK_GROUP_VALUE, buildFullBlockAttributes } from "./block-node-attrs";

export const ForTimeNode = Node.create({
  name: "forTime",
  group: BLOCK_GROUP_VALUE,
  content: "(text | inlineMention)*",
  defining: true,
  isolating: true,
  selectable: true,
  addAttributes: () => buildFullBlockAttributes(),
  parseHTML: () => [{ tag: 'section[data-block-kind="forTime"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "section",
    { ...HTMLAttributes, "data-block-kind": "forTime" },
    0,
  ],
});

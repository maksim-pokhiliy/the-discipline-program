import { Node } from "@tiptap/core";

import { BLOCK_GROUP_VALUE, buildFullBlockAttributes } from "./block-node-attrs";

export const StraightSetsNode = Node.create({
  name: "straightSets",
  group: BLOCK_GROUP_VALUE,
  content: "(text | inlineMention)*",
  defining: true,
  isolating: true,
  selectable: true,
  draggable: false,
  addAttributes: () => buildFullBlockAttributes(),
  parseHTML: () => [{ tag: 'section[data-block-kind="straightSets"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "section",
    { ...HTMLAttributes, "data-block-kind": "straightSets" },
    0,
  ],
});

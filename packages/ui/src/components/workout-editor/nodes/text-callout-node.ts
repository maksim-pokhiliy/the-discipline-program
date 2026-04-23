import { Node, type Attribute } from "@tiptap/core";

import { BLOCK_NODE_GROUP } from "../constants";

const toneAttr: Attribute = { default: "info" };
const noteAttr: Attribute = { default: null };
const sortAttr: Attribute = { default: 0 };

export const TextCalloutNode = Node.create({
  name: "textCallout",
  group: BLOCK_NODE_GROUP,
  content: "paragraph",
  defining: true,
  isolating: true,
  selectable: true,
  addAttributes: () => ({
    tone: toneAttr,
    note: noteAttr,
    sortOrder: sortAttr,
  }),
  parseHTML: () => [{ tag: 'section[data-block-kind="textCallout"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "section",
    { ...HTMLAttributes, "data-block-kind": "textCallout" },
    0,
  ],
});

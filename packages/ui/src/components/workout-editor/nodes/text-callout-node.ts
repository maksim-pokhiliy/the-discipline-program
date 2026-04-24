import { Node, type Attribute } from "@tiptap/core";

import { BLOCK_NODE_GROUP } from "../constants";

import { buildSchemelessBlockAttributes } from "./block-node-attrs";

const toneAttr: Attribute = { default: "info" };

export const TextCalloutNode = Node.create({
  name: "textCallout",
  group: BLOCK_NODE_GROUP,
  content: "paragraph",
  defining: true,
  isolating: true,
  selectable: true,
  addAttributes: () => ({ tone: toneAttr, ...buildSchemelessBlockAttributes() }),
  parseHTML: () => [{ tag: 'section[data-block-kind="textCallout"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "section",
    { ...HTMLAttributes, "data-block-kind": "textCallout" },
    0,
  ],
});

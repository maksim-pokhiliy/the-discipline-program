import { Node } from "@tiptap/core";

import { BLOCK_NODE_GROUP } from "../constants";

import { buildSchemelessBlockAttributes } from "./block-node-attrs";

export const NotesNode = Node.create({
  name: "notes",
  group: BLOCK_NODE_GROUP,
  content: "paragraph+",
  defining: true,
  isolating: true,
  selectable: true,
  addAttributes: () => ({ ...buildSchemelessBlockAttributes() }),
  parseHTML: () => [{ tag: 'section[data-block-kind="notes"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "section",
    { ...HTMLAttributes, "data-block-kind": "notes" },
    0,
  ],
});

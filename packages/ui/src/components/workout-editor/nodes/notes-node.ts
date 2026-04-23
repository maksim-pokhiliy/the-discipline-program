import { Node, type Attribute } from "@tiptap/core";

import { BLOCK_NODE_GROUP } from "../constants";

const noteAttr: Attribute = { default: null };
const sortAttr: Attribute = { default: 0 };

export const NotesNode = Node.create({
  name: "notes",
  group: BLOCK_NODE_GROUP,
  content: "paragraph+",
  defining: true,
  isolating: true,
  selectable: true,
  addAttributes: () => ({
    note: noteAttr,
    sortOrder: sortAttr,
  }),
  parseHTML: () => [{ tag: 'section[data-block-kind="notes"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "section",
    { ...HTMLAttributes, "data-block-kind": "notes" },
    0,
  ],
});

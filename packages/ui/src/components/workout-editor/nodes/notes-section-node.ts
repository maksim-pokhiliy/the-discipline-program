import { Node, type Attribute } from "@tiptap/core";

import { SECTION_NODE_GROUP } from "../schema/node-groups";

const stringNull: Attribute = { default: null };
const zero: Attribute = { default: 0 };

export interface NotesSectionAttrs {
  note: string | null;
  sortOrder: number;
}

export const NotesSectionNode = Node.create({
  name: "notesSection",
  group: SECTION_NODE_GROUP,
  content: "paragraph+",
  defining: true,
  isolating: true,
  selectable: true,
  draggable: false,
  addAttributes: () => ({
    note: stringNull,
    sortOrder: zero,
  }),
  parseHTML: () => [{ tag: "section[data-notes-section]" }],
  renderHTML: ({ HTMLAttributes }) => [
    "section",
    { ...HTMLAttributes, "data-notes-section": "" },
    0,
  ],
});

import { Node, type Attribute } from "@tiptap/core";

import { SECTION_NODE_GROUP } from "../schema/node-groups";

const toneAttr: Attribute = { default: "info" };
const stringNull: Attribute = { default: null };
const zero: Attribute = { default: 0 };

export interface TextCalloutSectionAttrs {
  tone: string;
  note: string | null;
  sortOrder: number;
}

export const TextCalloutSectionNode = Node.create({
  name: "textCalloutSection",
  group: SECTION_NODE_GROUP,
  content: "paragraph+",
  defining: true,
  isolating: true,
  selectable: true,
  draggable: false,
  addAttributes: () => ({
    tone: toneAttr,
    note: stringNull,
    sortOrder: zero,
  }),
  parseHTML: () => [{ tag: "section[data-text-callout-section]" }],
  renderHTML: ({ HTMLAttributes }) => [
    "section",
    { ...HTMLAttributes, "data-text-callout-section": "" },
    0,
  ],
});

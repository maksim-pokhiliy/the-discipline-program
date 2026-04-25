import { Node, type Attribute } from "@tiptap/core";

import { type SchemeKind } from "@repo/contracts/library/scheme";

import { SECTION_NODE_GROUP } from "../schema/node-groups";

const stringNull: Attribute = { default: null };
const numberNull: Attribute = { default: null };
const emptyObject: Attribute = { default: {} as Record<string, number> };
const zero: Attribute = { default: 0 };

export interface SchemeSectionAttrs {
  schemeId: string | null;
  schemeKind: SchemeKind | null;
  schemeConfig: Record<string, number>;
  effortPct: number | null;
  pace: string | null;
  note: string | null;
  sortOrder: number;
}

export const SchemeSectionNode = Node.create({
  name: "schemeSection",
  group: SECTION_NODE_GROUP,
  content: "(exerciseLine | emomSlot)*",
  defining: true,
  isolating: true,
  selectable: true,
  draggable: false,
  addAttributes: () => ({
    schemeId: stringNull,
    schemeKind: stringNull,
    schemeConfig: emptyObject,
    effortPct: numberNull,
    pace: stringNull,
    note: stringNull,
    sortOrder: zero,
  }),
  parseHTML: () => [{ tag: "section[data-scheme-section]" }],
  renderHTML: ({ HTMLAttributes }) => [
    "section",
    { ...HTMLAttributes, "data-scheme-section": "" },
    0,
  ],
});

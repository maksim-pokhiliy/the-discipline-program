import { Node, type Attribute } from "@tiptap/core";

import { INLINE_MENTION_GROUP, SCHEME_MENTION_NODE_NAME } from "../constants";

const nullable: Attribute = { default: null };
const emptyObject: Attribute = { default: {} as Record<string, number> };

export const SchemeMentionNode = Node.create({
  name: SCHEME_MENTION_NODE_NAME,
  group: INLINE_MENTION_GROUP,
  inline: true,
  atom: true,
  selectable: true,
  addAttributes: () => ({
    schemeId: nullable,
    schemeKind: nullable,
    schemeConfig: emptyObject,
    label: nullable,
  }),
  parseHTML: () => [{ tag: "span[data-scheme-mention]" }],
  renderHTML: ({ HTMLAttributes }) => ["span", { ...HTMLAttributes, "data-scheme-mention": "" }],
});

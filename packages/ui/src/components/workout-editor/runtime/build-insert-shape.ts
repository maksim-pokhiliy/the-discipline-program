import type { TiptapNode } from "@repo/contracts/common/tiptap-doc";

import type { SlashCommandItem } from "./slash-items-types";

export const buildInsertShape = (item: SlashCommandItem): TiptapNode => {
  switch (item.kind) {
    case "add-block":
      return {
        type: "block",
        attrs: { blockTypeId: item.blockTypeId, title: null, sortOrder: 0 },
        content: [],
      };
    case "add-scheme-section":
      return {
        type: "schemeSection",
        attrs: {
          schemeId: item.schemeId,
          schemeKind: item.schemeKind,
          schemeConfig: item.schemeConfig,
          effortPct: null,
          pace: null,
          note: null,
          sortOrder: 0,
        },
        content: [{ type: "exerciseLine", content: [] }],
      };
    case "add-notes-section":
      return {
        type: "notesSection",
        attrs: { note: null, sortOrder: 0 },
        content: [{ type: "paragraph", content: [] }],
      };
    case "add-text-callout-section":
      return {
        type: "textCalloutSection",
        attrs: { tone: "info", note: null, sortOrder: 0 },
        content: [{ type: "paragraph", content: [] }],
      };
  }
};

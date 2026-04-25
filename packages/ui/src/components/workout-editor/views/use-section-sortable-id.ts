import { useEditorState, type NodeViewProps } from "@tiptap/react";

import { synthesizeSectionId } from "../runtime/node-id-utils";

const FALLBACK_SORTABLE_ID = "section:invalid";

export const useSectionSortableId = (
  editor: NodeViewProps["editor"],
  getPos: NodeViewProps["getPos"],
): string => {
  const id = useEditorState({
    editor,
    selector: ({ editor: ctxEditor }) => {
      const pos = typeof getPos === "function" ? getPos() : undefined;

      if (pos === undefined) {
        return FALLBACK_SORTABLE_ID;
      }

      try {
        const $pos = ctxEditor.state.doc.resolve(pos);

        if ($pos.depth < 1) {
          return FALLBACK_SORTABLE_ID;
        }

        return synthesizeSectionId($pos.index(0), $pos.index(1));
      } catch {
        return FALLBACK_SORTABLE_ID;
      }
    },
  });

  return id ?? FALLBACK_SORTABLE_ID;
};

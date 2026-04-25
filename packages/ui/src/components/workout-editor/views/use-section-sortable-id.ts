import { useId } from "react";

import { useEditorState, type NodeViewProps } from "@tiptap/react";

import { synthesizeSectionId } from "../runtime/node-id-utils";

export const useSectionSortableId = (
  editor: NodeViewProps["editor"],
  getPos: NodeViewProps["getPos"],
): string => {
  const fallbackId = useId();
  const id = useEditorState({
    editor,
    selector: ({ editor: ctxEditor }) => {
      const pos = typeof getPos === "function" ? getPos() : undefined;

      if (pos === undefined) {
        return null;
      }

      try {
        const $pos = ctxEditor.state.doc.resolve(pos);

        if ($pos.depth < 1) {
          return null;
        }

        return synthesizeSectionId($pos.index(0), $pos.index(1));
      } catch {
        return null;
      }
    },
  });

  return id ?? `section:invalid:${fallbackId}`;
};

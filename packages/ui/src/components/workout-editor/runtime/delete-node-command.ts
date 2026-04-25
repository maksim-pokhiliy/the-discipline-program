import type { Editor } from "@tiptap/core";

export const deleteNodeAt = (editor: Editor, pos: number): boolean =>
  editor
    .chain()
    .focus()
    .command(({ tr }) => {
      const target = tr.doc.nodeAt(pos);

      if (target === null) {
        return false;
      }

      tr.delete(pos, pos + target.nodeSize);

      return true;
    })
    .run();

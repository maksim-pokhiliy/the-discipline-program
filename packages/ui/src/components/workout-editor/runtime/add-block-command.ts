import type { Editor } from "@tiptap/core";

import { buildInsertShape } from "./build-insert-shape";
import type { AddBlockSlashItem } from "./slash-items-types";

export const runAddBlock = (editor: Editor, item: AddBlockSlashItem): boolean => {
  const shape = buildInsertShape(item);
  const end = editor.state.doc.content.size;

  return editor.chain().focus().insertContentAt(end, shape).run();
};

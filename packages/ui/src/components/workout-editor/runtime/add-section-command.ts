import type { Editor } from "@tiptap/core";

import { buildInsertShape } from "./build-insert-shape";
import type { SlashCommandItem } from "./slash-items-types";

export const runAddSection = (
  editor: Editor,
  blockPos: number,
  item: SlashCommandItem,
): boolean => {
  if (item.kind === "add-block") {
    return false;
  }

  const blockNode = editor.state.doc.nodeAt(blockPos);

  if (blockNode === null || blockNode.type.name !== "block") {
    return false;
  }

  const shape = buildInsertShape(item);
  const insertPos = blockPos + blockNode.nodeSize - 1;

  return editor.chain().focus().insertContentAt(insertPos, shape).run();
};

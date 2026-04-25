import type { Editor, Range } from "@tiptap/core";

export type SlashContext = "docRoot" | "insideBlock";

export const resolveSlashContext = (editor: Editor, range: Range): SlashContext => {
  let resolved: ReturnType<typeof editor.state.doc.resolve>;

  try {
    resolved = editor.state.doc.resolve(range.from);
  } catch {
    return "docRoot";
  }

  for (let depth = resolved.depth; depth >= 0; depth -= 1) {
    const node = resolved.node(depth);

    if (node.type.name === "block") {
      return "insideBlock";
    }
  }

  return "docRoot";
};

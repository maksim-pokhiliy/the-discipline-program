import type { ComposeNode, ComposeProgram } from "../compose-tree.types";

import { cloneNode, insertChildInProgram, locateInProgram } from "./tree-ops";

export const duplicateNodeAsSibling = (
  program: ComposeProgram,
  source: ComposeNode,
): ComposeProgram => {
  const location = locateInProgram(program, source.id);

  if (location === null) {
    return program;
  }

  return insertChildInProgram(program, location.parentId, cloneNode(source), location.index + 1);
};

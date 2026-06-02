import type { ComposeNode, ComposeProgram, NodeId } from "../compose-tree.types";

import { cloneNode, insertChildInProgram } from "./tree-ops";

type ParentLocation = { parentId: NodeId; index: number };

const locateInContainer = (root: ComposeNode, id: NodeId): ParentLocation | null => {
  if (root.nodeType === "row") {
    return null;
  }

  const index = root.children.findIndex((child) => child.id === id);

  if (index >= 0) {
    return { parentId: root.id, index };
  }

  for (const child of root.children) {
    const found = locateInContainer(child, id);

    if (found !== null) {
      return found;
    }
  }

  return null;
};

const locateInProgram = (program: ComposeProgram, id: NodeId): ParentLocation | null => {
  for (const week of program.weeks) {
    for (const day of week.days) {
      for (const session of day.sessions) {
        for (const block of session.blocks) {
          const found = locateInContainer(block.root, id);

          if (found !== null) {
            return found;
          }
        }
      }
    }
  }

  return null;
};

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

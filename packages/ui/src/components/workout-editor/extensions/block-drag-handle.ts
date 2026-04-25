import { Extension } from "@tiptap/core";
import { Fragment, type Node as PMNode } from "@tiptap/pm/model";

import {
  parseBlockId,
  parseSectionId,
  synthesizeBlockId,
  synthesizeSectionId,
} from "../runtime/node-id-utils";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    workoutBlockDragHandle: {
      reorderBlocks: (ordering: ReadonlyArray<string>) => ReturnType;
      reorderSections: (blockPos: number, ordering: ReadonlyArray<string>) => ReturnType;
    };
  }
}

const collectChildren = (node: PMNode): PMNode[] => {
  const children: PMNode[] = [];

  node.forEach((child) => {
    children.push(child);
  });

  return children;
};

const reorderByIndices = (
  children: ReadonlyArray<PMNode>,
  indices: ReadonlyArray<number>,
): PMNode[] | null => {
  if (indices.length !== children.length) {
    return null;
  }

  const seen = new Set<number>();
  const result: PMNode[] = [];

  for (const idx of indices) {
    if (idx < 0 || idx >= children.length) {
      return null;
    }

    if (seen.has(idx)) {
      return null;
    }

    const child = children[idx];

    if (child === undefined) {
      return null;
    }

    seen.add(idx);
    result.push(child);
  }

  return result;
};

export const BlockDragHandleExtension = Extension.create({
  name: "workoutBlockDragHandle",

  addCommands() {
    return {
      reorderBlocks:
        (ordering) =>
        ({ state, dispatch }) => {
          const children = collectChildren(state.doc);
          const indices: number[] = [];

          for (const id of ordering) {
            const parsed = parseBlockId(id);

            if (parsed === null) {
              return false;
            }

            indices.push(parsed);
          }

          const reordered = reorderByIndices(children, indices);

          if (reordered === null) {
            return false;
          }

          if (!dispatch) {
            return true;
          }

          const fragment = Fragment.fromArray(reordered);
          const tr = state.tr.replaceWith(0, state.doc.content.size, fragment);

          dispatch(tr);

          return true;
        },

      reorderSections:
        (blockPos, ordering) =>
        ({ state, dispatch }) => {
          const blockNode = state.doc.nodeAt(blockPos);

          if (blockNode === null || blockNode.type.name !== "block") {
            return false;
          }

          const children = collectChildren(blockNode);
          const indices: number[] = [];

          for (const id of ordering) {
            const parsed = parseSectionId(id);

            if (parsed === null) {
              return false;
            }

            indices.push(parsed.sectionIndex);
          }

          const reordered = reorderByIndices(children, indices);

          if (reordered === null) {
            return false;
          }

          if (!dispatch) {
            return true;
          }

          const fragment = Fragment.fromArray(reordered);
          const nextBlock = blockNode.copy(fragment);
          const tr = state.tr.replaceWith(
            blockPos,
            blockPos + blockNode.nodeSize,
            Fragment.fromArray([nextBlock]),
          );

          dispatch(tr);

          return true;
        },
    };
  },
});

export { synthesizeBlockId, synthesizeSectionId, parseBlockId, parseSectionId };

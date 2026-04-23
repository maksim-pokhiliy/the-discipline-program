import { type TiptapDoc, type TiptapNode } from "@repo/contracts/common/tiptap-doc";

export type DocRefs = {
  blockTypeIds: Set<string>;
  schemeIds: Set<string>;
  exerciseIds: Set<string>;
};

const collectFromNode = (node: TiptapNode, refs: DocRefs): void => {
  if (node.attrs) {
    const blockTypeId = node.attrs.blockTypeId;

    if (typeof blockTypeId === "string" && blockTypeId.length > 0) {
      refs.blockTypeIds.add(blockTypeId);
    }

    const schemeId = node.attrs.schemeId;

    if (typeof schemeId === "string" && schemeId.length > 0) {
      refs.schemeIds.add(schemeId);
    }

    const exerciseId = node.attrs.exerciseId;

    if (typeof exerciseId === "string" && exerciseId.length > 0) {
      refs.exerciseIds.add(exerciseId);
    }
  }

  if (node.content) {
    for (const child of node.content) {
      collectFromNode(child, refs);
    }
  }
};

export const collectDocRefs = (doc: TiptapDoc): DocRefs => {
  const refs: DocRefs = {
    blockTypeIds: new Set<string>(),
    schemeIds: new Set<string>(),
    exerciseIds: new Set<string>(),
  };

  for (const node of doc.content) {
    collectFromNode(node, refs);
  }

  return refs;
};

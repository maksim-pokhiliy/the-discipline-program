import {
  BLOCK_WRAPPER_NODE_TYPE,
  type TiptapDoc,
  type TiptapNode,
} from "@repo/contracts/common/tiptap-doc";
import { WORKOUT_DOC_LIMITS } from "@repo/contracts/lms/workout-block";
import { BadRequestError } from "@repo/errors";

import { parseSectionNode } from "./parse-section-node";
import { blockWrapperAttrsSchema, toNodePath } from "./parser-schemas";
import {
  type LibraryLookup,
  type ParseWorkoutDocOptions,
  type SchemeSectionInput,
  type WorkoutBlockInput,
  type WorkoutTreeInput,
} from "./parser-types";

export type {
  EmomSlotInput,
  LibraryLookup,
  LibraryLookupEntry,
  ParseWorkoutDocOptions,
  SchemeSectionInput,
  WorkoutBlockExerciseInput,
  WorkoutBlockInput,
  WorkoutTreeInput,
} from "./parser-types";

const parseBlockWrapperNode = (
  node: TiptapNode,
  lookup: LibraryLookup,
  opts: ParseWorkoutDocOptions,
  path: string,
  index: number,
): WorkoutBlockInput => {
  if (node.type !== BLOCK_WRAPPER_NODE_TYPE) {
    throw new BadRequestError("Expected block wrapper node at doc root", {
      path,
      nodeType: node.type,
    });
  }

  const parsed = blockWrapperAttrsSchema.safeParse(node.attrs ?? {});

  if (!parsed.success) {
    throw new BadRequestError("Invalid block attrs", {
      path,
      nodeType: node.type,
      issues: parsed.error.issues,
    });
  }

  const attrs = parsed.data;

  if (!lookup.blockTypeIds.has(attrs.blockTypeId)) {
    throw new BadRequestError("Referenced blockTypeId not found in library", {
      path,
      blockTypeId: attrs.blockTypeId,
    });
  }

  const sections: SchemeSectionInput[] = (node.content ?? []).map((child, idx) =>
    parseSectionNode(child, lookup, opts, toNodePath(path, "content", idx), idx),
  );

  if (sections.length === 0 && opts.strict === true) {
    throw new BadRequestError("Block must contain at least one section", {
      code: "workout.block.empty",
      path,
    });
  }

  return {
    blockTypeId: attrs.blockTypeId,
    title: attrs.title ?? null,
    sortOrder: attrs.sortOrder ?? index,
    sections,
  };
};

export const parseTiptapDoc = (
  doc: TiptapDoc,
  lookup: LibraryLookup,
  opts: ParseWorkoutDocOptions,
): WorkoutTreeInput => {
  const serialized = JSON.stringify(doc);

  if (serialized.length > WORKOUT_DOC_LIMITS.MAX_DOC_BYTES) {
    throw new BadRequestError("Workout doc exceeds maximum byte size", {
      code: "workout.doc.too_large",
      limit: WORKOUT_DOC_LIMITS.MAX_DOC_BYTES,
      actual: serialized.length,
    });
  }

  let nodeCount = 0;

  const countNodes = (node: TiptapNode): void => {
    nodeCount += 1;

    if (nodeCount > WORKOUT_DOC_LIMITS.MAX_NODES_PER_DOC) {
      throw new BadRequestError("Workout doc exceeds maximum node count", {
        code: "workout.doc.too_many_nodes",
        limit: WORKOUT_DOC_LIMITS.MAX_NODES_PER_DOC,
        actual: nodeCount,
      });
    }

    node.content?.forEach(countNodes);
  };

  doc.content.forEach(countNodes);

  if (doc.content.length > WORKOUT_DOC_LIMITS.MAX_ROOT_BLOCKS) {
    throw new BadRequestError("Workout doc exceeds maximum root block count", {
      code: "workout.doc.too_many_root_blocks",
      limit: WORKOUT_DOC_LIMITS.MAX_ROOT_BLOCKS,
      actual: doc.content.length,
    });
  }

  const blocks: WorkoutBlockInput[] = doc.content.map((node, idx) =>
    parseBlockWrapperNode(node, lookup, opts, toNodePath("content", idx), idx),
  );

  return { blocks };
};

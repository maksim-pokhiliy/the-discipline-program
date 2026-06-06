import type { Composition } from "@repo/contracts/lms/composition";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import type { ArrangementAxis, ComposeContainer, ComposeNode, NodeId } from "../compose-tree.types";

import type { DraftArrangement } from "./arrangement-convert";
import { resolveArrangement } from "./arrangement-resolve";
import { composeContainerToComposition } from "./compose-to-create-requests";

export type SchemaCompositionUpdate = { schemaId: string; composition: Composition | null };

export type DiffResult =
  | { ok: true; updates: SchemaCompositionUpdate[] }
  | { ok: false; reason: "structural-divergence" };

const ROOT_SENTINEL = "__root__";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isDeepEqual = (left: unknown, right: unknown): boolean => {
  if (left === right) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length && left.every((item, index) => isDeepEqual(item, right[index]))
    );
  }

  if (isRecord(left) && isRecord(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    return (
      leftKeys.length === rightKeys.length &&
      leftKeys.every((key) => isDeepEqual(left[key], right[key]))
    );
  }

  return false;
};

type Linkage = Map<string, string>;

const collectOriginalLinkage = (node: SchemaWithBody, parentId: string, linkage: Linkage): void => {
  linkage.set(node.schema.id, parentId);

  for (const row of node.rows) {
    linkage.set(row.id, node.schema.id);
  }

  for (const subSchema of node.subSchemas) {
    collectOriginalLinkage(subSchema, node.schema.id, linkage);
  }
};

const collectEditedLinkage = (
  container: ComposeContainer,
  parentId: string,
  linkage: Linkage,
): void => {
  linkage.set(container.id, parentId);

  for (const child of container.children) {
    if (child.nodeType === "row") {
      linkage.set(child.id, container.id);

      continue;
    }

    collectEditedLinkage(child, container.id, linkage);
  }
};

const isStructurallyDivergent = (
  original: SchemaWithBody,
  editedTop: ComposeContainer,
): boolean => {
  const originalLinkage: Linkage = new Map();
  const editedLinkage: Linkage = new Map();

  collectOriginalLinkage(original, ROOT_SENTINEL, originalLinkage);
  collectEditedLinkage(editedTop, ROOT_SENTINEL, editedLinkage);

  if (originalLinkage.size !== editedLinkage.size) {
    return true;
  }

  for (const [id, parentId] of editedLinkage) {
    if (originalLinkage.get(id) !== parentId) {
      return true;
    }
  }

  return false;
};

const identityRefMap = (arrangement: DraftArrangement): ReadonlyMap<NodeId, string> => {
  const map = new Map<NodeId, string>();

  if (arrangement.kind === "parallel") {
    for (const track of arrangement.tracks) {
      map.set(track.childSchemaId, track.childSchemaId);

      if (track.pairedWithRowId !== undefined) {
        map.set(track.pairedWithRowId, track.pairedWithRowId);
      }
    }

    return map;
  }

  for (const pair of arrangement.pairs) {
    for (const rowId of pair.rowIds) {
      map.set(rowId, rowId);
    }
  }

  return map;
};

const foldArrangement = (arrangement: ArrangementAxis | undefined): Composition["arrangement"] => {
  if (arrangement === undefined || arrangement.kind === "ordered") {
    return undefined;
  }

  const resolved = resolveArrangement(arrangement, identityRefMap(arrangement));

  return resolved.ok ? resolved.arrangement : undefined;
};

const assembleEditedComposition = (
  container: ComposeContainer,
  original: Composition | null,
): Composition => {
  const base = composeContainerToComposition(container);
  const arrangement = foldArrangement(container.arrangement);
  const scoring = original?.scoring;

  return {
    ...(base.repetition !== undefined && { repetition: base.repetition }),
    ...(arrangement !== undefined && { arrangement }),
    ...(scoring !== undefined && { scoring }),
    ...(base.rest !== undefined && { rest: base.rest }),
    ...(base.programKind !== undefined && { programKind: base.programKind }),
  };
};

const byId = (subSchemas: SchemaWithBody[]): Map<string, SchemaWithBody> =>
  new Map(subSchemas.map((subSchema) => [subSchema.schema.id, subSchema]));

const directContainers = (children: ComposeNode[]): ComposeContainer[] =>
  children.filter((child): child is ComposeContainer => child.nodeType === "container");

const collectUpdates = (
  original: SchemaWithBody,
  editedContainer: ComposeContainer,
  updates: SchemaCompositionUpdate[],
): void => {
  const next = assembleEditedComposition(editedContainer, original.schema.composition);
  const current = original.schema.composition ?? {};

  if (!isDeepEqual(next, current)) {
    updates.push({ schemaId: original.schema.id, composition: next });
  }

  const originalById = byId(original.subSchemas);

  for (const childContainer of directContainers(editedContainer.children)) {
    const originalChild = originalById.get(childContainer.id);

    if (originalChild !== undefined) {
      collectUpdates(originalChild, childContainer, updates);
    }
  }
};

export const diffComposeAxesAgainstOriginal = (
  original: SchemaWithBody,
  editedRoot: ComposeContainer,
): DiffResult => {
  const editedTop = directContainers(editedRoot.children)[0];

  if (
    editedTop === undefined ||
    editedRoot.children.length !== 1 ||
    isStructurallyDivergent(original, editedTop)
  ) {
    return { ok: false, reason: "structural-divergence" };
  }

  const updates: SchemaCompositionUpdate[] = [];

  collectUpdates(original, editedTop, updates);

  return { ok: true, updates };
};

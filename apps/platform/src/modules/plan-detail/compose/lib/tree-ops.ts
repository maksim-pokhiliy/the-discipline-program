import { arrayMove } from "@dnd-kit/sortable";

import type {
  ArrangementAxis,
  ComposeBlock,
  ComposeContainer,
  ComposeDay,
  ComposeNode,
  ComposeProgram,
  ComposeSession,
  ComposeWeek,
  NodeId,
  ParallelTrackDraft,
} from "../compose-tree.types";

import { makeNodeId } from "./id-factory";

type IdRemap = Map<NodeId, NodeId>;

type NodeMapper = (node: ComposeNode) => ComposeNode | null;

const mapTree = (node: ComposeNode, fn: NodeMapper): ComposeNode | null => {
  if (node.nodeType === "row") {
    return fn(node);
  }

  const mappedChildren = node.children.reduce<ComposeNode[]>((acc, child) => {
    const next = mapTree(child, fn);

    if (next !== null) {
      acc.push(next);
    }

    return acc;
  }, []);

  return fn({ ...node, children: mappedChildren });
};

export const findNode = (root: ComposeNode, id: NodeId): ComposeNode | null => {
  if (root.id === id) {
    return root;
  }

  if (root.nodeType === "row") {
    return null;
  }

  for (const child of root.children) {
    const found = findNode(child, id);

    if (found !== null) {
      return found;
    }
  }

  return null;
};

const cloneSubtree = (node: ComposeNode, remap: IdRemap): ComposeNode => {
  const id = makeNodeId();

  remap.set(node.id, id);

  if (node.nodeType === "row") {
    return structuredClone({ ...node, id });
  }

  return {
    ...structuredClone({ ...node, children: [] }),
    id,
    children: node.children.map((child) => cloneSubtree(child, remap)),
  };
};

const remapTrack = (track: ParallelTrackDraft, remap: IdRemap): ParallelTrackDraft => {
  const { pairedWithRowId } = track;

  return {
    childSchemaId: remap.get(track.childSchemaId) ?? track.childSchemaId,
    ...(track.setEnumeration !== undefined && { setEnumeration: track.setEnumeration }),
    ...(pairedWithRowId !== undefined && {
      pairedWithRowId: remap.get(pairedWithRowId) ?? pairedWithRowId,
    }),
  };
};

const remapArrangement = (arrangement: ArrangementAxis, remap: IdRemap): ArrangementAxis => {
  switch (arrangement.kind) {
    case "ordered":
      return arrangement;
    case "parallel":
      return {
        ...arrangement,
        tracks: arrangement.tracks.map((track) => remapTrack(track, remap)),
      };
    case "superset":
      return {
        ...arrangement,
        pairs: arrangement.pairs.map((pair) => ({
          ...pair,
          rowIds: pair.rowIds.map((rowId) => remap.get(rowId) ?? rowId),
        })),
      };
    default:
      return arrangement satisfies never;
  }
};

const remapTreeArrangements = (node: ComposeNode, remap: IdRemap): ComposeNode => {
  if (node.nodeType === "row") {
    return node;
  }

  const children = node.children.map((child) => remapTreeArrangements(child, remap));

  if (node.arrangement === undefined) {
    return { ...node, children };
  }

  return { ...node, arrangement: remapArrangement(node.arrangement, remap), children };
};

export const cloneNode = (node: ComposeNode): ComposeNode => {
  const remap: IdRemap = new Map();
  const cloned = cloneSubtree(node, remap);

  return remapTreeArrangements(cloned, remap);
};

export const updateNode = (
  root: ComposeNode,
  id: NodeId,
  patch: (node: ComposeNode) => ComposeNode,
): ComposeNode => {
  const next = mapTree(root, (node) => (node.id === id ? patch(node) : node));

  return next ?? root;
};

export const insertChild = (
  root: ComposeNode,
  parentId: NodeId,
  child: ComposeNode,
  index?: number,
): ComposeNode =>
  updateNode(root, parentId, (node) => {
    if (node.nodeType === "row") {
      return node;
    }

    const at = index ?? node.children.length;
    const children = [...node.children.slice(0, at), child, ...node.children.slice(at)];

    return { ...node, children };
  });

export const removeNode = (root: ComposeNode, id: NodeId): ComposeNode => {
  const next = mapTree(root, (node) => (node.id === id ? null : node));

  return next ?? root;
};

export const moveChild = (
  root: ComposeNode,
  parentId: NodeId,
  fromIndex: number,
  toIndex: number,
): ComposeNode =>
  updateNode(root, parentId, (node) => {
    if (node.nodeType === "row") {
      return node;
    }

    return { ...node, children: arrayMove(node.children, fromIndex, toIndex) };
  });

const cloneContainerRoot = (root: ComposeContainer): ComposeContainer => {
  const cloned = cloneNode(root);

  return cloned.nodeType === "container" ? cloned : root;
};

export const cloneBlock = (block: ComposeBlock): ComposeBlock => ({
  id: makeNodeId(),
  label: block.label,
  root: cloneContainerRoot(block.root),
});

export const cloneSession = (session: ComposeSession): ComposeSession => ({
  id: makeNodeId(),
  label: session.label,
  blocks: session.blocks.map(cloneBlock),
});

export const cloneDay = (day: ComposeDay): ComposeDay => ({
  id: makeNodeId(),
  label: day.label,
  sessions: day.sessions.map(cloneSession),
});

export const cloneWeek = (week: ComposeWeek): ComposeWeek => ({
  id: makeNodeId(),
  label: week.label,
  days: week.days.map(cloneDay),
});

const mapBlockRoot = (
  program: ComposeProgram,
  apply: (root: ComposeContainer) => ComposeContainer,
): ComposeProgram => ({
  weeks: program.weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      sessions: day.sessions.map((session) => ({
        ...session,
        blocks: session.blocks.map((block) => ({ ...block, root: apply(block.root) })),
      })),
    })),
  })),
});

const scopeNodeOp = (
  root: ComposeContainer,
  op: (root: ComposeNode) => ComposeNode,
): ComposeContainer => {
  const next = op(root);

  return next.nodeType === "container" ? next : root;
};

export const findNodeInProgram = (program: ComposeProgram, id: NodeId): ComposeNode | null => {
  for (const week of program.weeks) {
    for (const day of week.days) {
      for (const session of day.sessions) {
        for (const block of session.blocks) {
          const found = findNode(block.root, id);

          if (found !== null) {
            return found;
          }
        }
      }
    }
  }

  return null;
};

export const updateNodeInProgram = (
  program: ComposeProgram,
  id: NodeId,
  patch: (node: ComposeNode) => ComposeNode,
): ComposeProgram =>
  mapBlockRoot(program, (root) => scopeNodeOp(root, (node) => updateNode(node, id, patch)));

export const removeNodeFromProgram = (program: ComposeProgram, id: NodeId): ComposeProgram =>
  mapBlockRoot(program, (root) => scopeNodeOp(root, (node) => removeNode(node, id)));

export const insertChildInProgram = (
  program: ComposeProgram,
  parentId: NodeId,
  child: ComposeNode,
  index?: number,
): ComposeProgram =>
  mapBlockRoot(program, (root) =>
    scopeNodeOp(root, (node) => insertChild(node, parentId, child, index)),
  );

export const moveChildInProgram = (
  program: ComposeProgram,
  parentId: NodeId,
  fromIndex: number,
  toIndex: number,
): ComposeProgram =>
  mapBlockRoot(program, (root) =>
    scopeNodeOp(root, (node) => moveChild(node, parentId, fromIndex, toIndex)),
  );

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

export const locateInProgram = (program: ComposeProgram, id: NodeId): ParentLocation | null => {
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

export const demoteContainerInProgram = (program: ComposeProgram, id: NodeId): ComposeProgram => {
  const node = findNodeInProgram(program, id);

  if (node === null || node.nodeType !== "container" || node.children.length !== 1) {
    return program;
  }

  const child = node.children[0];

  if (child === undefined || child.nodeType !== "row") {
    return program;
  }

  const location = locateInProgram(program, id);

  if (location === null) {
    return program;
  }

  return insertChildInProgram(
    removeNodeFromProgram(program, id),
    location.parentId,
    child,
    location.index,
  );
};

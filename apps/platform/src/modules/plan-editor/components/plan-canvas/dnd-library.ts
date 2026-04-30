import {
  type ExerciseSnapshot,
  type SchemeArchetypeKind,
  type SchemeParams,
} from "@repo/contracts/lms/_domain";
import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";

import { type DndLookups } from "./dnd-types";

export type LibraryDragKind = "exercise" | "block-kind" | "scheme-template";

export type LibraryDragData =
  | { kind: "exercise"; exerciseId: string; snapshot: ExerciseSnapshot }
  | { kind: "block-kind"; blockKindId: string; defaultWeight: number }
  | {
      kind: "scheme-template";
      schemeTemplateId: string;
      archetypeKind: SchemeArchetypeKind;
      defaultParams: SchemeParams;
    };

export type LibraryDropTarget =
  | { kind: "setGroup"; setGroupId: string; order: number }
  | { kind: "session"; sessionId: string; order: number }
  | { kind: "block"; blockId: string; order: number };

export const parseLibraryActiveKey = (activeKey: string): LibraryDragKind | null => {
  const sepIndex = activeKey.indexOf(":");

  if (sepIndex < 0) {
    return null;
  }

  const prefix = activeKey.slice(0, sepIndex);

  if (prefix === "exercise" || prefix === "block-kind" || prefix === "scheme-template") {
    return prefix;
  }

  return null;
};

export const isLibraryDragData = (value: unknown): value is LibraryDragData => {
  if (!value || typeof value !== "object" || !("kind" in value)) {
    return false;
  }

  const kind = (value as { kind: unknown }).kind;

  return kind === "exercise" || kind === "block-kind" || kind === "scheme-template";
};

const resolveExerciseTarget = (
  overKey: string,
  overPrefix: string,
  overId: string,
  lookups: DndLookups,
): LibraryDropTarget | null => {
  if (overPrefix === "setGroup") {
    const container = lookups.containers.get(overKey);

    if (!container || container.kind !== "setGroup") {
      return null;
    }

    return { kind: "setGroup", setGroupId: overId, order: container.entryIds.length };
  }

  if (overPrefix === "entry") {
    const containerKey = lookups.itemToContainer.get(overKey);
    const container = containerKey ? lookups.containers.get(containerKey) : undefined;

    if (!container || container.kind !== "setGroup") {
      return null;
    }

    return {
      kind: "setGroup",
      setGroupId: container.setGroupId,
      order: container.entryIds.length,
    };
  }

  return null;
};

const resolveBlockKindTarget = (
  overKey: string,
  overPrefix: string,
  overId: string,
  lookups: DndLookups,
): LibraryDropTarget | null => {
  if (overPrefix === "session") {
    const container = lookups.containers.get(overKey);

    if (!container || container.kind !== "session") {
      return null;
    }

    return { kind: "session", sessionId: overId, order: container.blockIds.length };
  }

  if (overPrefix === "block") {
    const containerKey = lookups.itemToContainer.get(overKey);
    const container = containerKey ? lookups.containers.get(containerKey) : undefined;

    if (!container || container.kind !== "session") {
      return null;
    }

    return {
      kind: "session",
      sessionId: container.sessionId,
      order: container.blockIds.length,
    };
  }

  return null;
};

const resolveSchemeTemplateTarget = (
  overKey: string,
  overPrefix: string,
  overId: string,
  lookups: DndLookups,
): LibraryDropTarget | null => {
  if (overPrefix === "block") {
    const containerKey = `block-container:${overId}`;
    const container = lookups.containers.get(containerKey);

    if (!container || container.kind !== "block") {
      return null;
    }

    return { kind: "block", blockId: overId, order: container.segmentIds.length };
  }

  if (overPrefix === "segment") {
    const containerKey = lookups.itemToContainer.get(overKey);
    const container = containerKey ? lookups.containers.get(containerKey) : undefined;

    if (!container || container.kind !== "block") {
      return null;
    }

    return { kind: "block", blockId: container.blockId, order: container.segmentIds.length };
  }

  return null;
};

export const resolveLibraryDropTarget = (
  libraryKind: LibraryDragKind,
  overKey: string,
  lookups: DndLookups,
): LibraryDropTarget | null => {
  const sepIndex = overKey.indexOf(":");

  if (sepIndex < 0) {
    return null;
  }

  const overPrefix = overKey.slice(0, sepIndex);
  const overId = overKey.slice(sepIndex + 1);

  if (libraryKind === "exercise") {
    return resolveExerciseTarget(overKey, overPrefix, overId, lookups);
  }

  if (libraryKind === "block-kind") {
    return resolveBlockKindTarget(overKey, overPrefix, overId, lookups);
  }

  return resolveSchemeTemplateTarget(overKey, overPrefix, overId, lookups);
};

export const buildLibraryOp = (
  active: LibraryDragData,
  target: LibraryDropTarget,
): BulkPatchOp | null => {
  if (active.kind === "exercise" && target.kind === "setGroup") {
    return {
      kind: "create-entry",
      setGroupId: target.setGroupId,
      payload: {
        order: target.order,
        exerciseId: active.exerciseId,
        exerciseSnapshot: active.snapshot,
        prescription: { sideMode: "BILATERAL", modifiers: [], reps: { kind: "FIXED", value: 10 } },
        alternatives: [],
      },
    };
  }

  if (active.kind === "block-kind" && target.kind === "session") {
    return {
      kind: "create-block",
      sessionId: target.sessionId,
      payload: {
        order: target.order,
        kindId: active.blockKindId,
        status: "ACTIVE",
        weight: active.defaultWeight,
      },
    };
  }

  if (active.kind === "scheme-template" && target.kind === "block") {
    return {
      kind: "create-segment",
      blockId: target.blockId,
      payload: {
        order: target.order,
        archetypeKind: active.archetypeKind,
        schemeParams: active.defaultParams,
        schemeTemplateId: active.schemeTemplateId,
      },
    };
  }

  return null;
};

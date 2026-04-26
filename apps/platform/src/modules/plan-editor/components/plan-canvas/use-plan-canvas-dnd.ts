"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import {
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { type BulkPatchOp, type GetPlanStructureResponse } from "@repo/contracts/lms/training-plan";

import { usePlanBulkPatch } from "@app/lib/hooks";

import { buildDndLookups, resolveContainerForOver } from "./dnd-lookups";
import { buildOptimisticMover } from "./dnd-optimistic";
import { type DraggableInfo } from "./dnd-types";

const buildOp = (
  active: DraggableInfo,
  targetContainerKey: string,
  targetIndex: number,
): BulkPatchOp | null => {
  const [targetType, targetId] = targetContainerKey.split(":");

  if (!targetId) {
    return null;
  }

  if (active.kind === "block" && targetType === "session") {
    return {
      kind: "move-block",
      blockId: active.blockId,
      expectedVersion: active.expectedVersion,
      targetSessionId: targetId,
      targetOrder: Math.max(0, targetIndex),
    };
  }

  if (active.kind === "segment" && targetType === "block-container") {
    return {
      kind: "move-segment",
      segmentId: active.segmentId,
      expectedVersion: active.expectedVersion,
      targetBlockId: targetId,
      targetOrder: Math.max(0, targetIndex),
    };
  }

  if (active.kind === "entry" && targetType === "setGroup") {
    return {
      kind: "move-entry",
      entryId: active.entryId,
      expectedVersion: active.expectedVersion,
      targetSetGroupId: targetId,
      targetOrder: Math.max(0, targetIndex),
    };
  }

  return null;
};

export type UsePlanCanvasDndApi = {
  sensors: ReturnType<typeof useSensors>;
  activeId: string | null;
  announcement: string;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
};

export const usePlanCanvasDnd = (
  planId: string,
  data: GetPlanStructureResponse | undefined,
): UsePlanCanvasDndApi => {
  const lookups = useMemo(() => buildDndLookups(data), [data]);
  const lookupsRef = useRef(lookups);

  lookupsRef.current = lookups;

  const bulkPatch = usePlanBulkPatch(planId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id);

    setActiveId(id);
    setAnnouncement(`Picked up ${id}`);
  }, []);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);

      const activeKey = String(event.active.id);
      const overKey = event.over ? String(event.over.id) : null;

      if (!overKey || activeKey === overKey) {
        setAnnouncement("Drop cancelled");

        return;
      }

      const active = lookupsRef.current.draggables.get(activeKey);

      if (!active) {
        return;
      }

      const target = resolveContainerForOver(overKey, lookupsRef.current, active.kind);

      if (!target) {
        setAnnouncement("Invalid drop target");

        return;
      }

      const op = buildOp(active, target.containerId, target.targetIndex);

      if (!op) {
        return;
      }

      const optimisticPatch = buildOptimisticMover(active, target.containerId, target.targetIndex);

      bulkPatch.mutate({ ops: [op], optimisticPatch });
      setAnnouncement(`Moved ${active.kind}`);
    },
    [bulkPatch],
  );

  return { sensors, activeId, announcement, onDragStart, onDragEnd };
};

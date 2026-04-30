"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import {
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { type BulkPatchOp, type GetPlanStructureResponse } from "@repo/contracts/lms/training-plan";

import {
  useApplyBlockTemplate,
  useApplySessionTemplate,
  useApplyWeekTemplate,
  usePlanBulkPatch,
} from "@app/lib/hooks";

import { type UsePlanHistoryApi } from "../undo-redo";

import { buildDndLookups, resolveContainerForOver } from "./dnd-lookups";
import { buildOptimisticMover } from "./dnd-optimistic";
import { type DraggableInfo } from "./dnd-types";

type TemplateDragKind = "template-block" | "template-session" | "template-week";

type ParsedTemplateActive = { kind: TemplateDragKind; templateId: string } | null;

const parseTemplateActiveKey = (activeKey: string): ParsedTemplateActive => {
  const sepIndex = activeKey.indexOf(":");

  if (sepIndex < 0) {
    return null;
  }

  const prefix = activeKey.slice(0, sepIndex);
  const templateId = activeKey.slice(sepIndex + 1);

  if (prefix === "template-block" || prefix === "template-session" || prefix === "template-week") {
    return { kind: prefix, templateId };
  }

  return null;
};

type DropTargetForTemplate =
  | { kind: "session"; sessionId: string; order: number }
  | { kind: "day"; dayId: string; order: number }
  | { kind: "week"; index: number };

const resolveTemplateDropTarget = (
  active: ParsedTemplateActive,
  overKey: string,
  data: GetPlanStructureResponse | undefined,
): DropTargetForTemplate | null => {
  if (!active || !data) {
    return null;
  }

  const sepIndex = overKey.indexOf(":");

  if (sepIndex < 0) {
    return null;
  }

  const overPrefix = overKey.slice(0, sepIndex);
  const overId = overKey.slice(sepIndex + 1);

  if (active.kind === "template-block" && overPrefix === "session") {
    let order = 0;

    for (const week of data.plan.weeks) {
      for (const day of week.days) {
        for (const session of day.sessions) {
          if (session.id === overId) {
            order = session.blocks.length;
          }
        }
      }
    }

    return { kind: "session", sessionId: overId, order };
  }

  if (active.kind === "template-session" && overPrefix === "day") {
    let order = 0;

    for (const week of data.plan.weeks) {
      for (const day of week.days) {
        if (day.id === overId) {
          order = day.sessions.length;
        }
      }
    }

    return { kind: "day", dayId: overId, order };
  }

  if (active.kind === "template-week" && overPrefix === "week") {
    const idx = Number.parseInt(overId, 10);

    if (Number.isNaN(idx)) {
      return null;
    }

    return { kind: "week", index: idx };
  }

  return null;
};

const buildHistoryEntry = (
  active: DraggableInfo,
  forward: BulkPatchOp,
): { forward: BulkPatchOp[]; inverse: BulkPatchOp[] } | null => {
  if (active.kind === "block" && forward.kind === "move-block") {
    return {
      forward: [forward],
      inverse: [
        {
          kind: "move-block",
          blockId: active.blockId,
          expectedVersion: active.expectedVersion + 1,
          targetSessionId: active.sourceSessionId,
          targetOrder: active.sourceIndex,
        },
      ],
    };
  }

  if (active.kind === "segment" && forward.kind === "move-segment") {
    return {
      forward: [forward],
      inverse: [
        {
          kind: "move-segment",
          segmentId: active.segmentId,
          expectedVersion: active.expectedVersion + 1,
          targetBlockId: active.sourceBlockId,
          targetOrder: active.sourceIndex,
        },
      ],
    };
  }

  if (active.kind === "entry" && forward.kind === "move-entry") {
    return {
      forward: [forward],
      inverse: [
        {
          kind: "move-entry",
          entryId: active.entryId,
          expectedVersion: active.expectedVersion + 1,
          targetSetGroupId: active.sourceSetGroupId,
          targetOrder: active.sourceIndex,
        },
      ],
    };
  }

  return null;
};

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
  history?: UsePlanHistoryApi,
): UsePlanCanvasDndApi => {
  const lookups = useMemo(() => buildDndLookups(data), [data]);
  const lookupsRef = useRef(lookups);
  const historyRef = useRef(history);
  const dataRef = useRef(data);

  lookupsRef.current = lookups;
  historyRef.current = history;
  dataRef.current = data;

  const bulkPatch = usePlanBulkPatch(planId);
  const applyBlockTemplate = useApplyBlockTemplate(planId);
  const applySessionTemplate = useApplySessionTemplate(planId);
  const applyWeekTemplate = useApplyWeekTemplate(planId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
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

      const templateActive = parseTemplateActiveKey(activeKey);

      if (templateActive) {
        const target = resolveTemplateDropTarget(templateActive, overKey, dataRef.current);

        if (!target) {
          setAnnouncement("Invalid template drop target");

          return;
        }

        if (templateActive.kind === "template-block" && target.kind === "session") {
          applyBlockTemplate.mutate({
            templateId: templateActive.templateId,
            target: { sessionId: target.sessionId, order: target.order },
          });
          setAnnouncement("Applied block template");

          return;
        }

        if (templateActive.kind === "template-session" && target.kind === "day") {
          applySessionTemplate.mutate({
            templateId: templateActive.templateId,
            target: { dayId: target.dayId, order: target.order },
          });
          setAnnouncement("Applied session template");

          return;
        }

        if (templateActive.kind === "template-week" && target.kind === "week") {
          applyWeekTemplate.mutate({
            templateId: templateActive.templateId,
            target: { index: target.index },
          });
          setAnnouncement("Applied week template");

          return;
        }

        setAnnouncement("Template drop kind mismatch");

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

      const entry = buildHistoryEntry(active, op);

      if (entry && historyRef.current) {
        historyRef.current.push({
          id: `${active.kind}-${activeKey}-${Date.now().toString()}`,
          forward: entry.forward,
          inverse: entry.inverse,
          label: `Move ${active.kind}`,
        });
      }

      setAnnouncement(`Moved ${active.kind}`);
    },
    [applyBlockTemplate, applySessionTemplate, applyWeekTemplate, bulkPatch],
  );

  return { sensors, activeId, announcement, onDragStart, onDragEnd };
};

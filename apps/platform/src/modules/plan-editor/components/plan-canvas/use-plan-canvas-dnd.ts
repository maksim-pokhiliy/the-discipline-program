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

import { type GetPlanStructureResponse } from "@repo/contracts/lms/training-plan";

import {
  useApplyBlockTemplate,
  useApplySessionTemplate,
  useApplyWeekTemplate,
  usePlanBulkPatch,
} from "@app/lib/hooks";

import { type UsePlanHistoryApi } from "../undo-redo";

import {
  buildLibraryOp,
  isLibraryDragData,
  parseLibraryActiveKey,
  resolveLibraryDropTarget,
} from "./dnd-library";
import { buildDndLookups, resolveContainerForOver } from "./dnd-lookups";
import { buildMoveHistoryEntry, buildMoveOp } from "./dnd-move-ops";
import { buildOptimisticMover } from "./dnd-optimistic";
import { parseTemplateActiveKey, resolveTemplateDropTarget } from "./dnd-templates";

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
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
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

      const libraryKind = parseLibraryActiveKey(activeKey);

      if (libraryKind) {
        const dragData = event.active.data.current;

        if (!isLibraryDragData(dragData) || dragData.kind !== libraryKind) {
          setAnnouncement("Invalid library drag payload");

          return;
        }

        const target = resolveLibraryDropTarget(libraryKind, overKey, lookupsRef.current);

        if (!target) {
          setAnnouncement("Invalid library drop target");

          return;
        }

        const op = buildLibraryOp(dragData, target);

        if (!op) {
          setAnnouncement("Library drop kind mismatch");

          return;
        }

        bulkPatch.mutate({ ops: [op] });
        setAnnouncement(`Added ${libraryKind}`);

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

      const op = buildMoveOp(active, target.containerId, target.targetIndex);

      if (!op) {
        return;
      }

      const optimisticPatch = buildOptimisticMover(active, target.containerId, target.targetIndex);

      bulkPatch.mutate({ ops: [op], optimisticPatch });

      const entry = buildMoveHistoryEntry(active, op);

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

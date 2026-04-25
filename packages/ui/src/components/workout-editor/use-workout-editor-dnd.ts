"use client";

import { useCallback } from "react";

import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { Editor } from "@tiptap/core";

import { parseBlockId, parseSectionId, synthesizeSectionId } from "./runtime/node-id-utils";

const POINTER_ACTIVATION_DISTANCE = 5;
const TOUCH_ACTIVATION_DELAY_MS = 150;
const TOUCH_ACTIVATION_TOLERANCE_PX = 5;

const reorderIds = (
  currentIds: ReadonlyArray<string>,
  activeId: string,
  overId: string,
): string[] => {
  const next = [...currentIds];
  const activeIdx = next.indexOf(activeId);
  const overIdx = next.indexOf(overId);

  if (activeIdx < 0 || overIdx < 0) {
    return next;
  }

  const [moved] = next.splice(activeIdx, 1);

  if (moved === undefined) {
    return next;
  }

  next.splice(overIdx, 0, moved);

  return next;
};

export const useWorkoutEditorDnd = (editor: Editor | null, rootBlockIds: ReadonlyArray<string>) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: POINTER_ACTIVATION_DISTANCE },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: TOUCH_ACTIVATION_DELAY_MS,
        tolerance: TOUCH_ACTIVATION_TOLERANCE_PX,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (editor === null) {
        return;
      }

      const { active, over } = event;

      if (over === null || active.id === over.id) {
        return;
      }

      const activeIdStr = String(active.id);
      const overIdStr = String(over.id);

      const activeBlockIdx = parseBlockId(activeIdStr);
      const overBlockIdx = parseBlockId(overIdStr);

      if (activeBlockIdx !== null && overBlockIdx !== null) {
        const ordering = reorderIds(rootBlockIds, activeIdStr, overIdStr);

        editor.commands.reorderBlocks(ordering);

        return;
      }

      const activeSection = parseSectionId(activeIdStr);
      const overSection = parseSectionId(overIdStr);

      if (
        activeSection === null ||
        overSection === null ||
        activeSection.blockIndex !== overSection.blockIndex
      ) {
        return;
      }

      let blockPos: number | null = null;
      let blockSectionCount = 0;

      editor.state.doc.forEach((child, offset, index) => {
        if (child.type.name === "block" && index === activeSection.blockIndex) {
          blockPos = offset;
          blockSectionCount = child.childCount;
        }
      });

      if (blockPos === null) {
        return;
      }

      const sectionIds: string[] = [];

      for (let idx = 0; idx < blockSectionCount; idx += 1) {
        sectionIds.push(synthesizeSectionId(activeSection.blockIndex, idx));
      }

      const ordering = reorderIds(sectionIds, activeIdStr, overIdStr);

      editor.commands.reorderSections(blockPos, ordering);
    },
    [editor, rootBlockIds],
  );

  return { sensors, handleDragEnd };
};

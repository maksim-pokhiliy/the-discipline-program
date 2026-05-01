"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { type BulkPatchOp } from "@repo/contracts/lms/training-plan";
import { logger } from "@repo/shared";
import { trimHistoryStack } from "@repo/ui";

import { usePlanBulkPatch } from "@app/lib/hooks";

export const UNDO_STACK_CAPACITY = 50;

export type UndoableEntry = {
  id: string;
  forward: BulkPatchOp[];
  inverse: BulkPatchOp[];
  label?: string;
};

export type UsePlanHistoryApi = {
  push: (entry: UndoableEntry) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  clear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
};

export const usePlanHistory = (planId: string): UsePlanHistoryApi => {
  const [undoStack, setUndoStack] = useState<UndoableEntry[]>([]);
  const [redoStack, setRedoStack] = useState<UndoableEntry[]>([]);
  const undoRef = useRef(undoStack);
  const redoRef = useRef(redoStack);
  const bulkPatch = usePlanBulkPatch(planId);

  undoRef.current = undoStack;
  redoRef.current = redoStack;

  const push = useCallback((entry: UndoableEntry) => {
    setUndoStack((prev) => trimHistoryStack([...prev, entry], UNDO_STACK_CAPACITY));
    setRedoStack([]);
  }, []);

  const undo = useCallback(async () => {
    const stack = undoRef.current;
    const last = stack[stack.length - 1];

    if (!last) {
      return;
    }

    setUndoStack((prev) => prev.slice(0, prev.length - 1));

    try {
      await bulkPatch.mutateAsync({ ops: last.inverse });
      setRedoStack((prev) => trimHistoryStack([...prev, last], UNDO_STACK_CAPACITY));
    } catch (error) {
      logger.warn("plan-editor.undo.bulk_patch_failed", {
        entryId: last.id,
        error: error instanceof Error ? error.message : String(error),
      });
      setUndoStack((prev) => trimHistoryStack([...prev, last], UNDO_STACK_CAPACITY));
    }
  }, [bulkPatch]);

  const redo = useCallback(async () => {
    const stack = redoRef.current;
    const last = stack[stack.length - 1];

    if (!last) {
      return;
    }

    setRedoStack((prev) => prev.slice(0, prev.length - 1));

    try {
      await bulkPatch.mutateAsync({ ops: last.forward });
      setUndoStack((prev) => trimHistoryStack([...prev, last], UNDO_STACK_CAPACITY));
    } catch (error) {
      logger.warn("plan-editor.redo.bulk_patch_failed", {
        entryId: last.id,
        error: error instanceof Error ? error.message : String(error),
      });
      setRedoStack((prev) => trimHistoryStack([...prev, last], UNDO_STACK_CAPACITY));
    }
  }, [bulkPatch]);

  const clear = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return useMemo<UsePlanHistoryApi>(
    () => ({
      push,
      undo,
      redo,
      clear,
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
      undoCount: undoStack.length,
      redoCount: redoStack.length,
    }),
    [clear, push, redo, redoStack.length, undo, undoStack.length],
  );
};

export type UseHistoryKeybindingsOptions = {
  history: UsePlanHistoryApi;
  enabled?: boolean;
};

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;

  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }

  return target.isContentEditable;
};

export const useHistoryKeybindings = (options: UseHistoryKeybindingsOptions): void => {
  const { history, enabled = true } = options;
  const historyRef = useRef(history);

  historyRef.current = history;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      const isMeta = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (!isMeta || key !== "z") {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();

      if (event.shiftKey) {
        void historyRef.current.redo();
      } else {
        void historyRef.current.undo();
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [enabled]);
};

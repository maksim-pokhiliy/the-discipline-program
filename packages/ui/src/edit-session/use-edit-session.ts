"use client";

import { useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";

import { ConflictError } from "@repo/errors";
import { useScopedMutation } from "@repo/query";

import { EditSessionContext } from "./edit-session-context";
import { type ConflictState, type UseEditSessionApi, type UseEditSessionConfig } from "./types";
import { createInitialState, editSessionReducer } from "./use-edit-session.reducer";

const DEFAULT_IDLE_SAVE_MS = 8000;
const DEFAULT_SAVED_FADE_MS = 5000;

const extractConflictVersion = (error: unknown): number | null => {
  if (error instanceof ConflictError) {
    const candidate = error.details?.currentVersion;

    return typeof candidate === "number" ? candidate : null;
  }

  if (error && typeof error === "object" && "currentVersion" in error) {
    const candidate = (error as { currentVersion?: unknown }).currentVersion;

    return typeof candidate === "number" ? candidate : null;
  }

  return null;
};

const isFunctionalUpdater = <TDraft>(
  next: TDraft | ((prev: TDraft) => TDraft),
): next is (prev: TDraft) => TDraft => typeof next === "function";

export const useEditSession = <TDraft>(
  config: UseEditSessionConfig<TDraft>,
): UseEditSessionApi<TDraft> => {
  const {
    sessionId,
    initial,
    expectedVersion,
    validate,
    mutationKey,
    mutationFn,
    label,
    idleSaveMs = DEFAULT_IDLE_SAVE_MS,
    savedFadeMs = DEFAULT_SAVED_FADE_MS,
    onSaved,
    onConflict,
  } = config;

  const reducer = editSessionReducer<TDraft>;

  const [state, dispatchAction] = useReducer(reducer, null, () =>
    createInitialState(initial, expectedVersion),
  );

  const stateRef = useRef(state);

  stateRef.current = state;

  const mutation = useScopedMutation<{ draft: TDraft; expectedVersion: number }, TDraft>(
    mutationKey,
    sessionId,
    async ({ draft, expectedVersion: version }) => mutationFn(draft, version),
  );

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const clearFadeTimer = useCallback(() => {
    if (fadeTimerRef.current !== null) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const performSave = useCallback(async (): Promise<void> => {
    const current = stateRef.current;

    if (current.status !== "dirty" || !current.isValid) {
      return;
    }

    const draftToSave = current.draft;
    const versionToSend = current.expectedVersion;

    dispatchAction({ type: "save-start" });

    try {
      const next = await mutation.mutateAsync({
        draft: draftToSave,
        expectedVersion: versionToSend,
      });

      const nextVersionCandidate = (next as { version?: unknown }).version;
      const nextVersion =
        typeof nextVersionCandidate === "number" ? nextVersionCandidate : versionToSend + 1;

      dispatchAction({
        type: "save-success",
        next,
        nextVersion,
        savedAt: new Date(),
      });

      onSaved?.(next);
    } catch (error) {
      const conflictVersion = extractConflictVersion(error);

      if (conflictVersion !== null) {
        dispatchAction({ type: "save-conflict", currentVersion: conflictVersion });
        onConflict?.(conflictVersion);

        return;
      }

      dispatchAction({
        type: "save-failure",
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [mutation, onConflict, onSaved]);

  const dispatch = useCallback(
    (next: TDraft | ((prev: TDraft) => TDraft)) => {
      const previous = stateRef.current;
      const resolved = isFunctionalUpdater(next) ? next(previous.draft) : next;
      const isClean = Object.is(resolved, previous.initial);

      if (isClean) {
        dispatchAction({ type: "dispatch-clean", draft: resolved });

        return;
      }

      const parsed = validate(resolved);

      if (parsed.success) {
        dispatchAction({ type: "dispatch-valid", draft: resolved });
      } else {
        dispatchAction({ type: "dispatch-invalid", draft: resolved });
      }
    },
    [validate],
  );

  const discard = useCallback(() => {
    clearIdleTimer();
    dispatchAction({ type: "discard" });
  }, [clearIdleTimer]);

  const reset = useCallback(
    (next: TDraft, version?: number) => {
      clearIdleTimer();
      clearFadeTimer();
      dispatchAction({ type: "reset", draft: next, version });
    },
    [clearFadeTimer, clearIdleTimer],
  );

  useEffect(() => {
    clearIdleTimer();

    if (state.status !== "dirty") {
      return;
    }

    idleTimerRef.current = setTimeout(() => {
      void performSave();
    }, idleSaveMs);

    return () => {
      clearIdleTimer();
    };
  }, [clearIdleTimer, idleSaveMs, performSave, state.status, state.draft]);

  useEffect(() => {
    if (state.status !== "saved") {
      return;
    }

    clearFadeTimer();
    fadeTimerRef.current = setTimeout(() => {
      dispatchAction({ type: "saved-fade" });
    }, savedFadeMs);

    return () => {
      clearFadeTimer();
    };
  }, [clearFadeTimer, savedFadeMs, state.status]);

  useEffect(
    () => () => {
      clearIdleTimer();
      clearFadeTimer();
    },
    [clearFadeTimer, clearIdleTimer],
  );

  const orchestrator = useContext(EditSessionContext);

  const apiSaveRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const apiDiscardRef = useRef<() => void>(() => undefined);

  apiSaveRef.current = performSave;
  apiDiscardRef.current = discard;

  useEffect(() => {
    if (!orchestrator) {
      return;
    }

    orchestrator.register({
      sessionId,
      label,
      status: state.status,
      isDirty: state.isDirty,
      isValid: state.isValid,
      save: () => apiSaveRef.current(),
      discard: () => apiDiscardRef.current(),
    });

    return () => {
      orchestrator.unregister(sessionId);
    };
  }, [orchestrator, sessionId, label, state.status, state.isDirty, state.isValid]);

  const conflict = useMemo<ConflictState | null>(() => state.conflict, [state.conflict]);

  return useMemo<UseEditSessionApi<TDraft>>(
    () => ({
      sessionId,
      draft: state.draft,
      dispatch,
      status: state.status,
      isDirty: state.isDirty,
      isValid: state.isValid,
      isSaving: state.status === "saving",
      lastSavedAt: state.lastSavedAt,
      conflict,
      error: state.error,
      expectedVersion: state.expectedVersion,
      save: performSave,
      discard,
      reset,
    }),
    [
      conflict,
      discard,
      dispatch,
      performSave,
      reset,
      sessionId,
      state.draft,
      state.error,
      state.expectedVersion,
      state.isDirty,
      state.isValid,
      state.lastSavedAt,
      state.status,
    ],
  );
};

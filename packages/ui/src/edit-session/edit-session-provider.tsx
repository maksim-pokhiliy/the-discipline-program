"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { EditSessionContext } from "./edit-session-context";
import { RouteChangeFlushModal } from "./route-change-flush-modal";
import {
  type EditSessionContextValue,
  type EditSessionRegistration,
  type FlushAllResult,
  type RouteChangeFlushResult,
} from "./types";

const FOCUSED_SESSION_ATTRIBUTE = "data-edit-session-id";

const findFocusedSessionId = (): string | null => {
  if (typeof document === "undefined") {
    return null;
  }

  let node: Element | null = document.activeElement;

  while (node && node !== document.body) {
    if (node instanceof HTMLElement) {
      const id = node.getAttribute(FOCUSED_SESSION_ATTRIBUTE);

      if (id) {
        return id;
      }
    }

    node = node.parentElement;
  }

  return null;
};

type ModalState = {
  open: boolean;
  isFlushing: boolean;
  dirtySessions: EditSessionRegistration[];
  blockedSessionIds: string[];
  resolve: (value: RouteChangeFlushResult) => void;
};

export type EditSessionProviderProps = {
  children: ReactNode;
  onConcurrentRouteChangeFlush?: () => void;
};

export const EditSessionProvider = ({
  children,
  onConcurrentRouteChangeFlush,
}: EditSessionProviderProps) => {
  const sessionsRef = useRef<Map<string, EditSessionRegistration>>(new Map());
  const [, setSessionsTick] = useState(0);
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const modalStateRef = useRef<ModalState | null>(null);
  const modalOpenRef = useRef(false);
  const onConcurrentRequestRef = useRef<(() => void) | undefined>(onConcurrentRouteChangeFlush);

  modalStateRef.current = modalState;
  onConcurrentRequestRef.current = onConcurrentRouteChangeFlush;

  const bumpSessions = useCallback(() => {
    setSessionsTick((tick) => tick + 1);
  }, []);

  const register = useCallback(
    (registration: EditSessionRegistration) => {
      sessionsRef.current.set(registration.sessionId, registration);
      bumpSessions();
    },
    [bumpSessions],
  );

  const unregister = useCallback(
    (sessionId: string) => {
      if (sessionsRef.current.delete(sessionId)) {
        bumpSessions();
      }
    },
    [bumpSessions],
  );

  const getDirtySessions = useCallback((): EditSessionRegistration[] => {
    const dirty: EditSessionRegistration[] = [];

    sessionsRef.current.forEach((session) => {
      if (session.isDirty) {
        dirty.push(session);
      }
    });

    return dirty;
  }, []);

  const flushSession = useCallback(async (sessionId: string): Promise<void> => {
    const session = sessionsRef.current.get(sessionId);

    if (!session) {
      return;
    }

    if (session.status !== "error" && session.status !== "dirty") {
      return;
    }

    await session.save();
  }, []);

  const flushAll = useCallback(async (): Promise<FlushAllResult> => {
    const dirty = getDirtySessions();
    const flushed: string[] = [];
    const blocked: string[] = [];

    const validSessions = dirty.filter((session) => session.isValid);
    const invalidSessions = dirty.filter((session) => !session.isValid);

    invalidSessions.forEach((session) => {
      blocked.push(session.sessionId);
    });

    await Promise.all(
      validSessions.map(async (session) => {
        try {
          await session.save();
          flushed.push(session.sessionId);
        } catch {
          blocked.push(session.sessionId);
        }
      }),
    );

    return { flushed, blocked };
  }, [getDirtySessions]);

  const requestRouteChangeFlush = useCallback((): Promise<RouteChangeFlushResult> => {
    const dirty = getDirtySessions();

    if (dirty.length === 0) {
      return Promise.resolve("proceed");
    }

    if (modalOpenRef.current) {
      onConcurrentRequestRef.current?.();

      return Promise.resolve("cancel");
    }

    modalOpenRef.current = true;

    return new Promise<RouteChangeFlushResult>((resolve) => {
      setModalState({
        open: true,
        isFlushing: false,
        dirtySessions: dirty,
        blockedSessionIds: [],
        resolve,
      });
    });
  }, [getDirtySessions]);

  const handleSaveAll = useCallback(async () => {
    const current = modalStateRef.current;

    if (!current) {
      return;
    }

    setModalState({ ...current, isFlushing: true });

    const result = await flushAll();

    if (result.blocked.length === 0) {
      current.resolve("proceed");
      modalOpenRef.current = false;
      setModalState(null);

      return;
    }

    setModalState({
      ...current,
      isFlushing: false,
      dirtySessions: getDirtySessions(),
      blockedSessionIds: result.blocked,
    });
  }, [flushAll, getDirtySessions]);

  const handleDiscardAll = useCallback(() => {
    const current = modalStateRef.current;

    if (!current) {
      return;
    }

    current.dirtySessions.forEach((session) => {
      session.discard();
    });
    current.resolve("proceed");
    modalOpenRef.current = false;
    setModalState(null);
  }, []);

  const handleCancel = useCallback(() => {
    const current = modalStateRef.current;

    if (!current) {
      return;
    }

    current.resolve("cancel");
    modalOpenRef.current = false;
    setModalState(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const isSaveKey = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";

      if (!isSaveKey) {
        return;
      }

      const focusedId = findFocusedSessionId();

      if (!focusedId) {
        return;
      }

      const session = sessionsRef.current.get(focusedId);

      if (!session) {
        return;
      }

      event.preventDefault();

      if (session.isDirty && session.isValid) {
        void session.save();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const value = useMemo<EditSessionContextValue>(
    () => ({
      register,
      unregister,
      getDirtySessions,
      flushAll,
      flushSession,
      requestRouteChangeFlush,
    }),
    [flushAll, flushSession, getDirtySessions, register, requestRouteChangeFlush, unregister],
  );

  return (
    <EditSessionContext.Provider value={value}>
      {children}
      {modalState ? (
        <RouteChangeFlushModal
          open={modalState.open}
          dirtySessions={modalState.dirtySessions}
          isFlushing={modalState.isFlushing}
          blockedSessionIds={modalState.blockedSessionIds}
          onSaveAll={() => {
            void handleSaveAll();
          }}
          onDiscardAll={handleDiscardAll}
          onCancel={handleCancel}
        />
      ) : null}
    </EditSessionContext.Provider>
  );
};

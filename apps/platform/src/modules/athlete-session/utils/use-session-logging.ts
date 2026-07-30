"use client";

import { useCallback, useMemo, useState } from "react";

import { type ResultType } from "@repo/contracts/lms/_shared";
import { type RowView, type SessionDetailResponse } from "@repo/contracts/lms/session-detail";

import { useCreatePerformedSession, useLogBenchmarkResult } from "@app/lib/hooks";

import { type BenchmarkSchema, collectBenchmarkSchemas } from "./athlete-session-presentation";
import { type LoadChipTarget } from "./load-cell";
import { buildResult, type ResultDraft, resultToDraft } from "./result-form-config";

export type SessionEditorControls = {
  activeLogSchemaId: string | null;
  isLoggingBenchmark: boolean;
  pulsingRowIds: ReadonlySet<string>;
  draftFor: (schemaId: string) => ResultDraft;
  openLog: (schemaId: string) => void;
  cancelLog: () => void;
  saveLog: (schemaId: string, resultType: ResultType) => void;
  setDraftField: (schemaId: string, key: string, value: string) => void;
  openWeightSheet: (row: RowView, target: LoadChipTarget) => void;
};

const EMPTY_DRAFT: ResultDraft = {};

export type SessionLogging = {
  activeLogSchemaId: string | null;
  isLoggingBenchmark: boolean;
  benchmarks: BenchmarkSchema[];
  note: string;
  isSheetOpen: boolean;
  isSubmitting: boolean;
  isLoggingState: boolean;
  draftFor: (schemaId: string) => ResultDraft;
  openLog: (schemaId: string) => void;
  cancelLog: () => void;
  saveLog: (schemaId: string, resultType: ResultType) => void;
  setDraftField: (schemaId: string, key: string, value: string) => void;
  setNote: (value: string) => void;
  openSheet: () => void;
  closeSheet: () => void;
  confirm: () => void;
  reopen: () => void;
};

export const useSessionLogging = (data: SessionDetailResponse): SessionLogging => {
  const { sessionId, done } = data.session;

  const [drafts, setDrafts] = useState<Record<string, ResultDraft>>({});
  const [activeLogSchemaId, setActiveLogSchemaId] = useState<string | null>(null);
  const [note, setNoteState] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isReopened, setIsReopened] = useState(false);

  const createPerformedSession = useCreatePerformedSession();
  const logBenchmark = useLogBenchmarkResult();

  const benchmarks = useMemo(() => collectBenchmarkSchemas(data.blocks), [data.blocks]);

  const setDraftField = useCallback((schemaId: string, key: string, value: string): void => {
    setDrafts((prev) => ({
      ...prev,
      [schemaId]: { ...(prev[schemaId] ?? EMPTY_DRAFT), [key]: value },
    }));
  }, []);

  const draftFor = useCallback(
    (schemaId: string): ResultDraft => drafts[schemaId] ?? EMPTY_DRAFT,
    [drafts],
  );

  const openLog = useCallback(
    (schemaId: string): void => {
      const benchmark = benchmarks.find((entry) => entry.schemaId === schemaId);
      const existing = benchmark?.existingResult ?? null;

      if (existing !== null) {
        setDrafts((prev) => ({ ...prev, [schemaId]: resultToDraft(existing) }));
      }

      setActiveLogSchemaId(schemaId);
    },
    [benchmarks],
  );

  const cancelLog = useCallback((): void => setActiveLogSchemaId(null), []);

  const saveLog = useCallback(
    (schemaId: string, resultType: ResultType): void => {
      if (logBenchmark.isPending) {
        return;
      }

      const result = buildResult(resultType, drafts[schemaId] ?? EMPTY_DRAFT);

      if (result === null) {
        return;
      }

      logBenchmark.mutate(
        { sessionId, data: { plannedSchemaId: schemaId, result } },
        {
          onSuccess: () => {
            setActiveLogSchemaId(null);
            setDrafts((prev) => {
              const next = { ...prev };

              delete next[schemaId];

              return next;
            });
          },
        },
      );
    },
    [logBenchmark, drafts, sessionId],
  );

  const openSheet = useCallback((): void => setIsSheetOpen(true), []);
  const closeSheet = useCallback((): void => setIsSheetOpen(false), []);

  const reopen = useCallback((): void => {
    setIsReopened(true);
    setIsSheetOpen(false);
  }, []);

  const isLoggingState = !done || isReopened;
  const isSubmitting = createPerformedSession.isPending;

  const confirm = useCallback((): void => {
    if (isSubmitting) {
      return;
    }

    const trimmedNote = note.trim();

    void createPerformedSession
      .mutateAsync({
        sessionId,
        performedAt: new Date(),
        athleteNotes: trimmedNote.length > 0 ? trimmedNote : null,
      })
      .then(
        () => {
          setIsSheetOpen(false);
          setIsReopened(false);
        },
        () => {},
      );
  }, [isSubmitting, note, sessionId, createPerformedSession]);

  return {
    activeLogSchemaId,
    isLoggingBenchmark: logBenchmark.isPending,
    benchmarks,
    note,
    isSheetOpen,
    isSubmitting,
    isLoggingState,
    draftFor,
    openLog,
    cancelLog,
    saveLog,
    setDraftField,
    setNote: setNoteState,
    openSheet,
    closeSheet,
    confirm,
    reopen,
  };
};

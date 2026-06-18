"use client";

import { useCallback, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import { type SessionDetailResponse } from "@repo/contracts/lms/session-detail";

import { platformKeys } from "@app/lib/api/keys";
import {
  useAthleteProfile,
  useCreateOneRMRecord,
  useCreatePerformedSchemaResult,
  useCreatePerformedSession,
  useUpdateAthleteProfile,
} from "@app/lib/hooks";

import {
  areBenchmarksReady,
  type BenchmarkSchema,
  collectBenchmarkSchemas,
} from "./athlete-session-presentation";
import { buildResult, type ResultDraft } from "./result-form-config";

export type ActiveEditor =
  | { rowId: string; kind: "one_rm"; exerciseId: string }
  | { rowId: string; kind: "profile" };

export type SessionEditorControls = {
  activeEditor: ActiveEditor | null;
  oneRmValue: string;
  oneRmCanSubmit: boolean;
  profileSelections: Record<string, string>;
  isSubmitting: boolean;
  openOneRmEditor: (rowId: string, exerciseId: string) => void;
  openProfileEditor: (rowId: string) => void;
  setOneRmValue: (value: string) => void;
  commitOneRm: () => void;
  pickProfile: (axisName: string, value: string) => void;
};

const EMPTY_DRAFT: ResultDraft = {};
const EMPTY_SELECTIONS: Record<string, string> = {};

const parseOneRm = (raw: string): number | null => {
  const parsed = Number(raw.trim());

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export type SessionLogging = {
  activeEditor: ActiveEditor | null;
  oneRmValue: string;
  oneRmCanSubmit: boolean;
  profileSelections: Record<string, string>;
  benchmarks: BenchmarkSchema[];
  drafts: Record<string, ResultDraft>;
  note: string;
  isSheetOpen: boolean;
  isSubmitting: boolean;
  isLoggingState: boolean;
  canConfirm: boolean;
  openOneRmEditor: (rowId: string, exerciseId: string) => void;
  openProfileEditor: (rowId: string) => void;
  closeEditor: () => void;
  setOneRmValue: (value: string) => void;
  commitOneRm: () => void;
  pickProfile: (axisName: string, value: string) => void;
  setDraftField: (schemaId: string, key: string, value: string) => void;
  setNote: (value: string) => void;
  openSheet: () => void;
  closeSheet: () => void;
  confirm: () => void;
  reopen: () => void;
};

export const useSessionLogging = (data: SessionDetailResponse): SessionLogging => {
  const { sessionId, done } = data.session;
  const queryClient = useQueryClient();

  const [activeEditor, setActiveEditor] = useState<ActiveEditor | null>(null);
  const [oneRmValue, setOneRmValueState] = useState("");
  const [drafts, setDrafts] = useState<Record<string, ResultDraft>>({});
  const [note, setNoteState] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isReopened, setIsReopened] = useState(false);

  const athleteProfile = useAthleteProfile();
  const updateProfile = useUpdateAthleteProfile();
  const createOneRm = useCreateOneRMRecord();
  const createPerformedSession = useCreatePerformedSession();
  const createSchemaResult = useCreatePerformedSchemaResult();

  const benchmarks = useMemo(() => collectBenchmarkSchemas(data.blocks), [data.blocks]);
  const profileSelections = athleteProfile.data?.profileSelections ?? EMPTY_SELECTIONS;

  const invalidateView = useCallback((): void => {
    queryClient.invalidateQueries({
      queryKey: platformKeys.athleteSessionView.detail(sessionId),
    });
  }, [queryClient, sessionId]);

  const openOneRmEditor = useCallback((rowId: string, exerciseId: string): void => {
    setOneRmValueState("");
    setActiveEditor({ rowId, kind: "one_rm", exerciseId });
  }, []);

  const openProfileEditor = useCallback((rowId: string): void => {
    setActiveEditor({ rowId, kind: "profile" });
  }, []);

  const closeEditor = useCallback((): void => {
    setActiveEditor(null);
  }, []);

  const commitOneRm = useCallback((): void => {
    if (activeEditor?.kind !== "one_rm") {
      return;
    }

    const valueKg = parseOneRm(oneRmValue);

    if (valueKg === null) {
      return;
    }

    createOneRm.mutate(
      {
        exerciseId: activeEditor.exerciseId,
        valueKg,
        recordedAt: new Date(),
        source: OneRMRecordSource.MANUAL,
      },
      {
        onSuccess: () => {
          invalidateView();
          setActiveEditor(null);
        },
      },
    );
  }, [activeEditor, oneRmValue, createOneRm, invalidateView]);

  const pickProfile = useCallback(
    (axisName: string, value: string): void => {
      const merged = { ...profileSelections, [axisName]: value };

      updateProfile.mutate({ profileSelections: merged }, { onSuccess: invalidateView });
    },
    [profileSelections, updateProfile, invalidateView],
  );

  const setDraftField = useCallback((schemaId: string, key: string, value: string): void => {
    setDrafts((prev) => ({
      ...prev,
      [schemaId]: { ...(prev[schemaId] ?? EMPTY_DRAFT), [key]: value },
    }));
  }, []);

  const openSheet = useCallback((): void => setIsSheetOpen(true), []);
  const closeSheet = useCallback((): void => setIsSheetOpen(false), []);

  const reopen = useCallback((): void => {
    setIsReopened(true);
    setIsSheetOpen(false);
  }, []);

  const isLoggingState = !done || isReopened;
  const canConfirm = areBenchmarksReady(benchmarks, drafts);
  const isSubmitting = createPerformedSession.isPending || createSchemaResult.isPending;

  const confirm = useCallback((): void => {
    if (!canConfirm || isSubmitting) {
      return;
    }

    const trimmedNote = note.trim();

    void (async () => {
      try {
        const performed = await createPerformedSession.mutateAsync({
          sessionId,
          performedAt: new Date(),
          athleteNotes: trimmedNote.length > 0 ? trimmedNote : null,
        });

        for (const benchmark of benchmarks) {
          const result = buildResult(
            benchmark.resultType,
            drafts[benchmark.schemaId] ?? EMPTY_DRAFT,
          );

          if (result === null) {
            continue;
          }

          await createSchemaResult.mutateAsync({
            performedSessionId: performed.id,
            sessionId,
            data: { plannedSchemaId: benchmark.schemaId, result },
          });
        }

        setIsSheetOpen(false);
        setIsReopened(false);
      } catch (error) {
        void error;
      }
    })();
  }, [
    canConfirm,
    isSubmitting,
    note,
    sessionId,
    benchmarks,
    drafts,
    createPerformedSession,
    createSchemaResult,
  ]);

  return {
    activeEditor,
    oneRmValue,
    oneRmCanSubmit: parseOneRm(oneRmValue) !== null,
    profileSelections,
    benchmarks,
    drafts,
    note,
    isSheetOpen,
    isSubmitting,
    isLoggingState,
    canConfirm,
    openOneRmEditor,
    openProfileEditor,
    closeEditor,
    setOneRmValue: setOneRmValueState,
    commitOneRm,
    pickProfile,
    setDraftField,
    setNote: setNoteState,
    openSheet,
    closeSheet,
    confirm,
    reopen,
  };
};

"use client";

import { useCallback, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { type ResultType } from "@repo/contracts/lms/_shared";
import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import { type SessionDetailResponse } from "@repo/contracts/lms/session-detail";

import { platformKeys } from "@app/lib/api/keys";
import {
  useAthleteProfile,
  useCreateOneRMRecord,
  useCreatePerformedSession,
  useLogBenchmarkResult,
  useUpdateAthleteProfile,
} from "@app/lib/hooks";

import { type BenchmarkSchema, collectBenchmarkSchemas } from "./athlete-session-presentation";
import { buildResult, type ResultDraft, resultToDraft } from "./result-form-config";

export type ActiveEditor =
  | { rowId: string; kind: "one_rm"; exerciseId: string }
  | { rowId: string; kind: "profile" };

export type SessionEditorControls = {
  activeEditor: ActiveEditor | null;
  oneRmValue: string;
  oneRmCanSubmit: boolean;
  oneRmPending: boolean;
  profileSelections: Record<string, string>;
  profilePending: boolean;
  activeLogSchemaId: string | null;
  isLoggingBenchmark: boolean;
  openOneRmEditor: (rowId: string, exerciseId: string) => void;
  openProfileEditor: (rowId: string) => void;
  closeEditor: () => void;
  setOneRmValue: (value: string) => void;
  commitOneRm: () => void;
  pickProfile: (axisNames: string[], axisName: string, value: string) => void;
  draftFor: (schemaId: string) => ResultDraft;
  openLog: (schemaId: string) => void;
  cancelLog: () => void;
  saveLog: (schemaId: string, resultType: ResultType) => void;
  setDraftField: (schemaId: string, key: string, value: string) => void;
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
  oneRmPending: boolean;
  profileSelections: Record<string, string>;
  profilePending: boolean;
  activeLogSchemaId: string | null;
  isLoggingBenchmark: boolean;
  benchmarks: BenchmarkSchema[];
  note: string;
  isSheetOpen: boolean;
  isSubmitting: boolean;
  isLoggingState: boolean;
  openOneRmEditor: (rowId: string, exerciseId: string) => void;
  openProfileEditor: (rowId: string) => void;
  closeEditor: () => void;
  setOneRmValue: (value: string) => void;
  commitOneRm: () => void;
  pickProfile: (axisNames: string[], axisName: string, value: string) => void;
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
  const queryClient = useQueryClient();

  const [activeEditor, setActiveEditor] = useState<ActiveEditor | null>(null);
  const [oneRmValue, setOneRmValueState] = useState("");
  const [stagedProfile, setStagedProfile] = useState<Record<string, string>>(EMPTY_SELECTIONS);
  const [drafts, setDrafts] = useState<Record<string, ResultDraft>>({});
  const [activeLogSchemaId, setActiveLogSchemaId] = useState<string | null>(null);
  const [note, setNoteState] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isReopened, setIsReopened] = useState(false);

  const athleteProfile = useAthleteProfile();
  const updateProfile = useUpdateAthleteProfile();
  const createOneRm = useCreateOneRMRecord();
  const createPerformedSession = useCreatePerformedSession();
  const logBenchmark = useLogBenchmarkResult();

  const benchmarks = useMemo(() => collectBenchmarkSchemas(data.blocks), [data.blocks]);
  const savedSelections = athleteProfile.data?.profileSelections ?? EMPTY_SELECTIONS;
  const profileSelections = useMemo(
    () => ({ ...savedSelections, ...stagedProfile }),
    [savedSelections, stagedProfile],
  );

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
    setStagedProfile(EMPTY_SELECTIONS);
    setActiveEditor({ rowId, kind: "profile" });
  }, []);

  const closeEditor = useCallback((): void => {
    setStagedProfile(EMPTY_SELECTIONS);
    setActiveEditor(null);
  }, []);

  const commitOneRm = useCallback((): void => {
    if (activeEditor?.kind !== "one_rm" || createOneRm.isPending) {
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
    (axisNames: string[], axisName: string, value: string): void => {
      if (updateProfile.isPending) {
        return;
      }

      const merged = { ...savedSelections, ...stagedProfile, [axisName]: value };
      const isFullPick = axisNames.every((name) => merged[name] !== undefined);

      if (!isFullPick) {
        setStagedProfile((prev) => ({ ...prev, [axisName]: value }));

        return;
      }

      updateProfile.mutate(
        { profileSelections: merged },
        {
          onSuccess: () => {
            invalidateView();
            setActiveEditor(null);
          },
        },
      );
    },
    [savedSelections, stagedProfile, updateProfile, invalidateView],
  );

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
    activeEditor,
    oneRmValue,
    oneRmCanSubmit: parseOneRm(oneRmValue) !== null,
    oneRmPending: createOneRm.isPending,
    profileSelections,
    profilePending: updateProfile.isPending,
    activeLogSchemaId,
    isLoggingBenchmark: logBenchmark.isPending,
    benchmarks,
    note,
    isSheetOpen,
    isSubmitting,
    isLoggingState,
    openOneRmEditor,
    openProfileEditor,
    closeEditor,
    setOneRmValue: setOneRmValueState,
    commitOneRm,
    pickProfile,
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

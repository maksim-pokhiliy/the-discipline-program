"use client";

import { useEffect, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type RowView, type SessionDetailResponse } from "@repo/contracts/lms/session-detail";

import { platformKeys } from "@app/lib/api/keys";
import { useAthleteProfile, useSwitchAthleteProfileLevel } from "@app/lib/hooks";
import { type LevelApplyOutcome, type LevelAxis, useLevelApply } from "@app/lib/level-switch";

import { collectRowViews } from "./athlete-session-presentation";
import { GENDER_BY_COORD } from "./gender-coord-map";
import { type LoadChipTarget } from "./load-cell";
import { useMaxSave } from "./use-max-save";
import {
  boundAxisIdsOf,
  buildLevelMessages,
  buildLevelPatch,
  buildLevelReceipt,
  changingRowIds,
  coordinatesOf,
  type LevelState,
  levelAxesOf,
  mergeLevelState,
  rowIdsSharingAxes,
  type Settlement,
  type WeightSheetState,
} from "./weight-sheet-model";
import { PULSE_CLEAR_MS, RECEIPT_LEVEL_STALE } from "./weight-sheet.constants";

export type { LevelState, WeightSheetState } from "./weight-sheet-model";

export type WeightSheetControls = {
  sheet: WeightSheetState | null;
  displayedSheet: WeightSheetState | null;
  levelAxes: LevelAxis[];
  levelCoordinates: Record<string, string>;
  levelSavedCoordinates: Record<string, string>;
  levelWeightCount: number;
  isLevelDraftComplete: boolean;
  isApplyingLevel: boolean;
  isOtherApplyPending: boolean;
  levelOutcome: LevelApplyOutcome | null;
  maxValue: string;
  isSavingMax: boolean;
  canSaveMax: boolean;
  closeSheet: () => void;
  forgetDisplayedSheet: () => void;
  pickLevelCoordinate: (axisId: string, value: string) => void;
  applyLevel: () => void;
  setMaxValue: (value: string) => void;
  saveMax: () => void;
};

export type WeightSheet = {
  controls: WeightSheetControls;
  pulsingRowIds: ReadonlySet<string>;
  openWeightSheet: (row: RowView, target: LoadChipTarget) => void;
};

const EMPTY_SELECTIONS: Record<string, string> = {};
const EMPTY_ROW_IDS: ReadonlySet<string> = new Set<string>();
const EMPTY_DRAFT: LevelState = { selections: EMPTY_SELECTIONS, gender: null };

export const useWeightSheet = (data: SessionDetailResponse): WeightSheet => {
  const { sessionId } = data.session;
  const { blocks } = data;
  const queryClient = useQueryClient();

  const [sheet, setSheet] = useState<WeightSheetState | null>(null);
  const [displayedSheet, setDisplayedSheet] = useState<WeightSheetState | null>(null);
  const [levelDraft, setLevelDraft] = useState<LevelState>(EMPTY_DRAFT);
  const [applyingSheet, setApplyingSheet] = useState<WeightSheetState | null>(null);
  const [pulsingRowIds, setPulsingRowIds] = useState<ReadonlySet<string>>(EMPTY_ROW_IDS);

  if (sheet !== null && sheet !== displayedSheet) {
    setDisplayedSheet(sheet);
  }

  const { data: profile } = useAthleteProfile();
  const switchLevel = useSwitchAthleteProfileLevel();
  const levelApply = useLevelApply<null>(switchLevel.mutateAsync);

  const savedLevel = useMemo<LevelState | null>(
    () =>
      profile === undefined
        ? null
        : { selections: profile.profileSelections ?? EMPTY_SELECTIONS, gender: profile.gender },
    [profile],
  );

  const rows = useMemo(() => collectRowViews(blocks), [blocks]);
  const boundAxisIds = useMemo(() => boundAxisIdsOf(rows), [rows]);

  const levelAxes = useMemo(
    () => levelAxesOf(displayedSheet?.kind === "level" ? displayedSheet.row : null),
    [displayedSheet],
  );
  const levelScopeRowIds = useMemo(() => rowIdsSharingAxes(rows, levelAxes), [rows, levelAxes]);
  const draftLevel = useMemo(
    () => mergeLevelState(savedLevel, levelDraft),
    [savedLevel, levelDraft],
  );
  const levelCoordinates = useMemo(
    () => coordinatesOf(levelAxes, draftLevel),
    [levelAxes, draftLevel],
  );
  const levelSavedCoordinates = useMemo(
    () => coordinatesOf(levelAxes, savedLevel ?? EMPTY_DRAFT),
    [levelAxes, savedLevel],
  );
  const levelChangingRowIds = useMemo(() => changingRowIds(rows, draftLevel), [rows, draftLevel]);
  const levelPatch = buildLevelPatch({
    axes: levelAxes,
    coordinates: levelCoordinates,
    saved: savedLevel,
    boundAxisIds,
  });

  const isApplyingLevel = applyingSheet !== null && applyingSheet === sheet;
  const isOtherApplyPending = applyingSheet !== null && applyingSheet !== sheet;

  useEffect(() => {
    if (pulsingRowIds.size === 0) {
      return undefined;
    }

    const timer = setTimeout(() => setPulsingRowIds(EMPTY_ROW_IDS), PULSE_CLEAR_MS);

    return () => clearTimeout(timer);
  }, [pulsingRowIds]);

  const settle = async ({
    opened,
    queryKeys,
    pulseRowIds,
    receipt,
    staleReceipt,
  }: Settlement): Promise<void> => {
    let isRefetched = true;

    try {
      await Promise.all(
        queryKeys.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }, { throwOnError: true }),
        ),
      );
    } catch {
      isRefetched = false;
    }

    setSheet((current) => (current === opened ? null : current));

    if (!isRefetched) {
      toast.success(staleReceipt);

      return;
    }

    if (pulseRowIds.length > 0) {
      setPulsingRowIds(new Set(pulseRowIds));
    }

    toast.success(receipt);
  };

  const maxSave = useMaxSave({ sheet, rows, sessionId, settle });

  const openWeightSheet = (row: RowView, target: LoadChipTarget): void => {
    switch (target.kind) {
      case "level":
        setLevelDraft(EMPTY_DRAFT);
        setSheet({ kind: "level", row });

        return;
      case "one_rm":
        maxSave.setValue("");
        setSheet({ kind: "one_rm", row, exerciseId: target.exerciseId });

        return;
      default:
        target satisfies never;
    }
  };

  const closeSheet = (): void => {
    if (sheet !== null) {
      levelApply.dismiss(sheet.row.rowId);
    }

    setSheet(null);
  };

  const pickLevelCoordinate = (axisId: string, value: string): void => {
    const axis = levelAxes.find((candidate) => candidate.id === axisId);

    if (axis === undefined || isApplyingLevel) {
      return;
    }

    if (axis.binding === null) {
      setLevelDraft((current) => ({
        ...current,
        selections: { ...current.selections, [axisId]: value },
      }));

      return;
    }

    const gender = GENDER_BY_COORD[value];

    if (gender === undefined) {
      return;
    }

    setLevelDraft((current) => ({ ...current, gender }));
  };

  const applyLevel = (): void => {
    if (sheet === null || sheet.kind !== "level" || applyingSheet !== null) {
      return;
    }

    if (levelPatch === null || savedLevel === null) {
      return;
    }

    const opened = sheet;
    const { rowId } = sheet.row;
    const coordinates = levelAxes
      .map((axis) => levelCoordinates[axis.id])
      .filter((value): value is string => value !== undefined);
    const pulseRowIds = levelChangingRowIds;
    const receipt = buildLevelReceipt(coordinates, pulseRowIds.length);
    const { appliedMessage, failedMessage } = buildLevelMessages(levelAxes, levelPatch, savedLevel);

    setApplyingSheet(opened);

    void (async (): Promise<void> => {
      try {
        const isApplied = await levelApply.apply({
          scope: rowId,
          meta: null,
          patch: levelPatch,
          appliedMessage,
          failedMessage,
          failedValue: null,
        });

        if (!isApplied) {
          return;
        }

        levelApply.dismiss(rowId);
        await settle({
          opened,
          queryKeys: [platformKeys.athleteSessionView.detail(sessionId)],
          pulseRowIds,
          receipt,
          staleReceipt: RECEIPT_LEVEL_STALE,
        });
      } finally {
        setApplyingSheet((current) => (current === opened ? null : current));
      }
    })();
  };

  const levelOutcome =
    displayedSheet !== null && displayedSheet.kind === "level"
      ? (levelApply.outcomes[displayedSheet.row.rowId] ?? null)
      : null;

  const forgetDisplayedSheet = (): void => {
    setDisplayedSheet(null);
  };

  return {
    controls: {
      sheet,
      displayedSheet,
      levelAxes,
      levelCoordinates,
      levelSavedCoordinates,
      levelWeightCount: levelScopeRowIds.length,
      isLevelDraftComplete: levelPatch !== null,
      isApplyingLevel,
      isOtherApplyPending,
      levelOutcome,
      maxValue: maxSave.value,
      isSavingMax: maxSave.isSaving,
      canSaveMax: maxSave.canSave,
      closeSheet,
      forgetDisplayedSheet,
      pickLevelCoordinate,
      applyLevel,
      setMaxValue: maxSave.setValue,
      saveMax: maxSave.save,
    },
    pulsingRowIds,
    openWeightSheet,
  };
};

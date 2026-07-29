"use client";

import { useEffect, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import { type RowView, type SessionDetailResponse } from "@repo/contracts/lms/session-detail";

import { platformKeys } from "@app/lib/api/keys";
import {
  useAthleteProfile,
  useCreateOneRMRecord,
  useSwitchAthleteProfileLevel,
} from "@app/lib/hooks";
import {
  buildAppliedMessage,
  buildFailedMessage,
  type LevelApplyOutcome,
  type LevelAxis,
  useLevelApply,
} from "@app/lib/level-switch";

import { collectRowViews } from "./athlete-session-presentation";
import { GENDER_BY_COORD } from "./gender-coord-map";
import { type LoadChipTarget } from "./load-cell";
import {
  buildLevelPatch,
  buildLevelReceipt,
  buildMaxReceipt,
  coordinatesOf,
  exerciseOf,
  type LevelDraft,
  levelAxesOf,
  parseOneRm,
} from "./weight-sheet-model";
import { PULSE_CLEAR_MS } from "./weight-sheet.constants";

export type { LevelDraft } from "./weight-sheet-model";

export type WeightSheetState =
  | { kind: "level"; row: RowView }
  | { kind: "one_rm"; row: RowView; exerciseId: string };

export type WeightSheetControls = {
  sheet: WeightSheetState | null;
  levelAxes: LevelAxis[];
  levelCoordinates: Record<string, string>;
  levelWeightCount: number;
  isLevelDraftComplete: boolean;
  isApplyingLevel: boolean;
  levelOutcome: LevelApplyOutcome | null;
  maxValue: string;
  isSavingMax: boolean;
  canSaveMax: boolean;
  closeSheet: () => void;
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
const EMPTY_DRAFT: LevelDraft = { selections: EMPTY_SELECTIONS, gender: null };

export const useWeightSheet = (data: SessionDetailResponse): WeightSheet => {
  const { sessionId } = data.session;
  const { blocks } = data;
  const queryClient = useQueryClient();

  const [sheet, setSheet] = useState<WeightSheetState | null>(null);
  const [levelDraft, setLevelDraft] = useState<LevelDraft>(EMPTY_DRAFT);
  const [maxValue, setMaxValue] = useState("");
  const [isApplyingLevel, setIsApplyingLevel] = useState(false);
  const [pulsingRowIds, setPulsingRowIds] = useState<ReadonlySet<string>>(EMPTY_ROW_IDS);

  const athleteProfile = useAthleteProfile();
  const switchLevel = useSwitchAthleteProfileLevel();
  const createOneRm = useCreateOneRMRecord();
  const levelApply = useLevelApply<null>(switchLevel.mutateAsync);

  const savedSelections = athleteProfile.data?.profileSelections ?? EMPTY_SELECTIONS;
  const savedGender = athleteProfile.data?.gender ?? null;

  const rows = useMemo(() => collectRowViews(blocks), [blocks]);
  const levelRowIds = useMemo(
    () => rows.filter((row) => row.load?.kind === "byProfile").map((row) => row.rowId),
    [rows],
  );

  const levelAxes = useMemo(() => levelAxesOf(sheet?.kind === "level" ? sheet.row : null), [sheet]);
  const levelCoordinates = useMemo(
    () => coordinatesOf(levelAxes, levelDraft),
    [levelAxes, levelDraft],
  );
  const levelPatch = buildLevelPatch(levelAxes, levelCoordinates, savedSelections);

  useEffect(() => {
    if (pulsingRowIds.size === 0) {
      return undefined;
    }

    const timer = setTimeout(() => setPulsingRowIds(EMPTY_ROW_IDS), PULSE_CLEAR_MS);

    return () => clearTimeout(timer);
  }, [pulsingRowIds]);

  const settle = async (pulseRowIds: string[], receipt: string): Promise<void> => {
    let isRefetched = true;

    try {
      await queryClient.invalidateQueries(
        { queryKey: platformKeys.athleteSessionView.detail(sessionId) },
        { throwOnError: true },
      );
    } catch {
      isRefetched = false;
    }

    setSheet(null);

    if (isRefetched && pulseRowIds.length > 0) {
      setPulsingRowIds(new Set(pulseRowIds));
    }

    toast.success(receipt);
  };

  const openWeightSheet = (row: RowView, target: LoadChipTarget): void => {
    switch (target.kind) {
      case "level":
        setLevelDraft({ selections: savedSelections, gender: savedGender });
        setSheet({ kind: "level", row });

        return;
      case "one_rm":
        setMaxValue("");
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
    if (sheet === null || sheet.kind !== "level" || isApplyingLevel || levelPatch === null) {
      return;
    }

    const { rowId } = sheet.row;
    const coordinates = levelAxes
      .map((axis) => levelCoordinates[axis.id])
      .filter((value): value is string => value !== undefined);
    const receipt = buildLevelReceipt(coordinates, levelRowIds.length);
    const appliedMessage = buildAppliedMessage({
      axes: levelAxes,
      selections: levelPatch.profileSelections ?? EMPTY_SELECTIONS,
      gender: levelPatch.gender ?? savedGender,
    });
    const failedMessage = buildFailedMessage({
      axes: levelAxes,
      selections: savedSelections,
      gender: savedGender,
    });

    setIsApplyingLevel(true);

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
        await settle(levelRowIds, receipt);
      } finally {
        setIsApplyingLevel(false);
      }
    })();
  };

  const saveMax = (): void => {
    if (sheet === null || sheet.kind !== "one_rm" || createOneRm.isPending) {
      return;
    }

    const valueKg = parseOneRm(maxValue);

    if (valueKg === null) {
      return;
    }

    const { exerciseId } = sheet;
    const receipt = buildMaxReceipt(sheet.row.movement, valueKg);
    const pulseRowIds = rows
      .filter((row) => exerciseOf(row) === exerciseId)
      .map((row) => row.rowId);

    void (async (): Promise<void> => {
      try {
        await createOneRm.mutateAsync({
          exerciseId,
          valueKg,
          recordedAt: new Date(),
          source: OneRMRecordSource.MANUAL,
        });
      } catch {
        return;
      }

      await settle(pulseRowIds, receipt);
    })();
  };

  const levelOutcome =
    sheet !== null && sheet.kind === "level"
      ? (levelApply.outcomes[sheet.row.rowId] ?? null)
      : null;

  return {
    controls: {
      sheet,
      levelAxes,
      levelCoordinates,
      levelWeightCount: levelRowIds.length,
      isLevelDraftComplete: levelPatch !== null,
      isApplyingLevel,
      levelOutcome,
      maxValue,
      isSavingMax: createOneRm.isPending,
      canSaveMax: parseOneRm(maxValue) !== null,
      closeSheet,
      pickLevelCoordinate,
      applyLevel,
      setMaxValue,
      saveMax,
    },
    pulsingRowIds,
    openWeightSheet,
  };
};

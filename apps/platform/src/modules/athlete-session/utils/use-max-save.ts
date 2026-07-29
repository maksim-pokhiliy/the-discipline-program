"use client";

import { useState } from "react";

import { toast } from "sonner";

import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import { type RowView } from "@repo/contracts/lms/session-detail";

import { platformKeys } from "@app/lib/api/keys";
import { useCreateOneRMRecord } from "@app/lib/hooks";

import {
  buildMaxReceipt,
  exerciseOf,
  parseOneRm,
  type Settlement,
  type WeightSheetState,
} from "./weight-sheet-model";
import { MAX_OFFLINE_MESSAGE } from "./weight-sheet.constants";

export type MaxSaveInput = {
  sheet: WeightSheetState | null;
  rows: RowView[];
  sessionId: string;
  settle: (settlement: Settlement) => Promise<void>;
};

export type MaxSave = {
  value: string;
  isSaving: boolean;
  canSave: boolean;
  setValue: (value: string) => void;
  save: () => void;
};

const isBrowserOffline = (): boolean =>
  typeof navigator !== "undefined" && navigator.onLine === false;

export const useMaxSave = ({ sheet, rows, sessionId, settle }: MaxSaveInput): MaxSave => {
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const createOneRm = useCreateOneRMRecord();

  const save = (): void => {
    if (sheet === null || sheet.kind !== "one_rm" || isSaving) {
      return;
    }

    const valueKg = parseOneRm(value);

    if (valueKg === null) {
      return;
    }

    if (isBrowserOffline()) {
      toast.error(MAX_OFFLINE_MESSAGE);

      return;
    }

    const opened = sheet;
    const { exerciseId } = sheet;
    const receipt = buildMaxReceipt(sheet.row.movement, valueKg);
    const pulseRowIds = rows
      .filter((row) => exerciseOf(row) === exerciseId)
      .map((row) => row.rowId);

    setIsSaving(true);

    void (async (): Promise<void> => {
      try {
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

        await settle({
          opened,
          queryKeys: [
            platformKeys.athleteSessionView.detail(sessionId),
            platformKeys.athleteRecords.data(),
          ],
          pulseRowIds,
          receipt,
        });
      } finally {
        setIsSaving(false);
      }
    })();
  };

  return {
    value,
    isSaving,
    canSave: parseOneRm(value) !== null,
    setValue,
    save,
  };
};

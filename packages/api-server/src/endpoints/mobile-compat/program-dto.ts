import { InternalServerError } from "@repo/errors";

import { type LegacyDailyProgram } from "../../infrastructure/legacy-mobile";
import { toUtcDateParam } from "../../utils";

import { findLegacyCatalogEntry, LEGACY_TRAINING_LEVELS } from "./legacy-catalogs";
import {
  type LegacyGeneralProgramDto,
  type LegacyIndividualProgramDto,
  legacyDailyProgramSchema,
} from "./wire-schemas";

export type ProgramSnapshotRow = {
  legacyRowId: number;
  scheduledDate: Date;
  isRestDay: boolean | null;
  dailyProgram: unknown;
};

type ProgramContent = { isRestDay: boolean; dailyProgram: LegacyDailyProgram | null };

const resolveContent = (row: ProgramSnapshotRow): ProgramContent => {
  if (row.isRestDay === null) {
    throw new InternalServerError("Published day snapshot carries no content", {
      legacyRowId: row.legacyRowId,
    });
  }

  if (row.isRestDay) {
    return { isRestDay: true, dailyProgram: null };
  }

  if (row.dailyProgram === null || row.dailyProgram === undefined) {
    throw new InternalServerError("Training day snapshot has no dailyProgram", {
      legacyRowId: row.legacyRowId,
    });
  }

  return { isRestDay: false, dailyProgram: legacyDailyProgramSchema.parse(row.dailyProgram) };
};

const assembleBaseProgram = (row: ProgramSnapshotRow) => {
  const content = resolveContent(row);

  return {
    id: row.legacyRowId,
    scheduledDate: toUtcDateParam(row.scheduledDate),
    isRestDay: content.isRestDay,
    dailyProgram: content.dailyProgram,
  };
};

export const assembleGeneralProgramDto = (
  row: ProgramSnapshotRow,
  legacyLevelId: number,
): LegacyGeneralProgramDto => {
  const trainingLevel = findLegacyCatalogEntry(LEGACY_TRAINING_LEVELS, legacyLevelId);

  if (!trainingLevel) {
    throw new InternalServerError("Legacy training level id is not mapped", { legacyLevelId });
  }

  return { ...assembleBaseProgram(row), trainingLevel };
};

export const assembleIndividualProgramDto = (
  row: ProgramSnapshotRow,
  legacyUserId: number,
): LegacyIndividualProgramDto => ({
  ...assembleBaseProgram(row),
  userId: legacyUserId,
});

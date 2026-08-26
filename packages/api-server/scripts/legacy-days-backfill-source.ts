import { z } from "zod";

import { isValidIsoDate } from "../src/endpoints/mobile-compat/legacy-date";
import { legacyDailyProgramSchema } from "../src/endpoints/mobile-compat/wire-schemas";
import type { LegacyDailyProgram } from "../src/infrastructure/legacy-mobile";
import { stableStringify } from "../src/utils/hash";

import {
  type BackfillConflictReason,
  LEGACY_TABLES,
  type LegacyProgramTable,
} from "./legacy-days-backfill-plan";
import { duplicatesOf } from "./script-cli";

const MAX_INT4 = 2_147_483_647;

const programBodySchema = z.union([z.null(), z.record(z.unknown())]);

const rowShape = {
  id: z.number().int().positive().max(MAX_INT4),
  scheduled_date: z.string().refine(isValidIsoDate),
  is_rest_day: z.boolean(),
  daily_program: programBodySchema,
};

const generalRowSchema = z.object({ ...rowShape, training_level_id: z.number().int() }).strict();

const individualRowSchema = z.object({ ...rowShape, user_id: z.number().int() }).strict();

export const legacyDaysSourceSchema = z
  .object({
    general: z.array(generalRowSchema),
    individual: z.array(individualRowSchema),
  })
  .strict()
  .refine(
    (file) => file.general.length > 0 || file.individual.length > 0,
    "the export holds no rows at all; a run that fills nothing is almost always a wrong export",
  );

export type LegacyGeneralRow = z.infer<typeof generalRowSchema>;

export type LegacyIndividualRow = z.infer<typeof individualRowSchema>;

export type NormalizedLegacyDay = {
  table: LegacyProgramTable;
  legacyRowId: number;
  legacyTargetId: number;
  scheduledDate: string;
  isRestDay: boolean;
  dailyProgram: LegacyDailyProgram | null;
};

export type LegacyDaysDefect = {
  table: LegacyProgramTable;
  legacyRowId: number;
  reason: BackfillConflictReason;
  detail: string;
};

export type ParsedLegacyDays = {
  rows: readonly NormalizedLegacyDay[];
  defects: readonly LegacyDaysDefect[];
};

type RawRow = { id: number; scheduled_date: string; is_rest_day: boolean; daily_program: unknown };

const readProgramBody = (
  body: unknown,
): { program: LegacyDailyProgram } | { reason: BackfillConflictReason; detail: string } => {
  const parsed = legacyDailyProgramSchema.safeParse(body);

  if (!parsed.success) {
    return {
      reason: "program-body-is-not-the-wire-shape",
      detail:
        "the program body is not the shape the app is served; writing it would make the shim " +
        "refuse the day rather than serve it",
    };
  }

  if (stableStringify(body) !== stableStringify(parsed.data)) {
    return {
      reason: "program-body-carries-fields-we-would-drop",
      detail:
        "the program body carries fields outside the wire shape, and importing it would silently " +
        "drop them; the export, not the row, is what to look at first",
    };
  }

  return { program: parsed.data };
};

const normalizeRow = (
  table: LegacyProgramTable,
  row: RawRow,
  legacyTargetId: number,
): { row: NormalizedLegacyDay } | { defect: LegacyDaysDefect } => {
  const shared = { table, legacyRowId: row.id };

  if (row.is_rest_day && row.daily_program !== null) {
    return {
      defect: {
        ...shared,
        reason: "rest-day-carries-a-program",
        detail: "a rest day cannot carry a program; the ledger's own constraint would reject it",
      },
    };
  }

  if (!row.is_rest_day && row.daily_program === null) {
    return {
      defect: {
        ...shared,
        reason: "training-day-carries-no-program",
        detail:
          "a training day with no program is the one state the app cannot render; the ledger's " +
          "own constraint would reject it",
      },
    };
  }

  if (row.daily_program === null) {
    return {
      row: {
        ...shared,
        legacyTargetId,
        scheduledDate: row.scheduled_date,
        isRestDay: row.is_rest_day,
        dailyProgram: null,
      },
    };
  }

  const body = readProgramBody(row.daily_program);

  if (!("program" in body)) {
    return { defect: { ...shared, ...body } };
  }

  return {
    row: {
      ...shared,
      legacyTargetId,
      scheduledDate: row.scheduled_date,
      isRestDay: false,
      dailyProgram: body.program,
    },
  };
};

const normalizeTable = <TRow extends RawRow>(
  table: LegacyProgramTable,
  rows: readonly TRow[],
  targetIdOf: (row: TRow) => number,
): ParsedLegacyDays => {
  const repeated = duplicatesOf(rows.map((row) => row.id));
  const normalized: NormalizedLegacyDay[] = [];
  const defects: LegacyDaysDefect[] = [];

  for (const row of rows) {
    if (repeated.has(row.id)) {
      defects.push({
        table,
        legacyRowId: row.id,
        reason: "duplicate-legacy-row-id",
        detail: "this row id appears more than once in the export, which a dump cannot produce",
      });

      continue;
    }

    const outcome = normalizeRow(table, row, targetIdOf(row));

    if ("defect" in outcome) {
      defects.push(outcome.defect);

      continue;
    }

    normalized.push(outcome.row);
  }

  return { rows: normalized, defects };
};

export const normalizeLegacyDays = (file: {
  general: readonly LegacyGeneralRow[];
  individual: readonly LegacyIndividualRow[];
}): ParsedLegacyDays => {
  const general = normalizeTable(
    LEGACY_TABLES.GENERAL,
    file.general,
    (row) => row.training_level_id,
  );
  const individual = normalizeTable(
    LEGACY_TABLES.INDIVIDUAL,
    file.individual,
    (row) => row.user_id,
  );

  return {
    rows: [...general.rows, ...individual.rows],
    defects: [...general.defects, ...individual.defects],
  };
};

export const parseLegacyDays = (raw: unknown): ParsedLegacyDays =>
  normalizeLegacyDays(legacyDaysSourceSchema.parse(raw));

import { type SchemeSection as PrismaSchemeSection } from "@prisma/client";

import {
  type EmomSlot,
  type SchemeConfig,
  type SchemeSection,
  type SchemeSectionKind,
  schemeConfigSchema,
  schemeSectionKindSchema,
  type WorkoutBlockExercise,
} from "@repo/contracts/lms/workout-block";

import { SCHEME_KIND_MAP } from "../library/enum-maps";

import {
  type EmomSlotRow,
  toEmomSlotDto,
  toWorkoutBlockExerciseDto,
  type WorkoutBlockExerciseRow,
} from "./exercise-row.mapper";

export type SchemeSectionRow = PrismaSchemeSection & {
  exercises?: WorkoutBlockExerciseRow[];
  emomSlots?: EmomSlotRow[];
};

const parseSchemeConfig = (value: PrismaSchemeSection["schemeConfig"]): SchemeConfig | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = schemeConfigSchema.safeParse(value);

  return parsed.success ? parsed.data : null;
};

const parseSectionKind = (value: PrismaSchemeSection["kind"]): SchemeSectionKind => {
  const parsed = schemeSectionKindSchema.safeParse(value);

  if (!parsed.success) {
    return schemeSectionKindSchema.parse("SCHEME");
  }

  return parsed.data;
};

export const toSchemeSectionDto = (row: SchemeSectionRow): SchemeSection => {
  const exercises: WorkoutBlockExercise[] | undefined = row.exercises
    ? row.exercises.map(toWorkoutBlockExerciseDto)
    : undefined;

  const emomSlots: EmomSlot[] | undefined = row.emomSlots
    ? row.emomSlots.map(toEmomSlotDto)
    : undefined;

  return {
    id: row.id,
    blockId: row.blockId,
    kind: parseSectionKind(row.kind),
    schemeId: row.schemeId,
    schemeKind: row.schemeKind ? SCHEME_KIND_MAP[row.schemeKind] : null,
    schemeConfig: parseSchemeConfig(row.schemeConfig),
    effortPct: row.effortPct,
    pace: row.pace,
    note: row.note,
    tone: row.tone,
    sortOrder: row.sortOrder,
    exercises,
    emomSlots,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

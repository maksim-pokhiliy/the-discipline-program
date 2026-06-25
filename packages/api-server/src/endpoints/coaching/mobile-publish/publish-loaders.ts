import { type DayOfWeek, type Load, loadSchema } from "@repo/contracts/lms/_shared";
import { type ExerciseById } from "@repo/contracts/lms/row-text";

import { prisma } from "../../../db/client";
import { mapToExercise } from "../../../mappers/lms";
import { DAY_OF_WEEK_TO_PRISMA } from "../../lms/_shared";

import { MOBILE_PUBLISH_DAY_INCLUDE, type MobilePublishDayPayload } from "./day-include";

type DayRow =
  MobilePublishDayPayload["sessions"][number]["blocks"][number]["schemas"][number]["rows"][number];

const referencedExerciseId = (load: Load): string | null =>
  load.kind === "percentage" && load.reference.scope === "other_exercise"
    ? load.reference.targetExerciseId
    : null;

const collectRowExerciseIds = (row: DayRow, ids: Set<string>): void => {
  ids.add(row.exerciseId);

  const referenced = row.load === null ? null : referencedExerciseId(loadSchema.parse(row.load));

  if (referenced !== null) {
    ids.add(referenced);
  }
};

const collectDayExerciseIds = (days: MobilePublishDayPayload[]): string[] => {
  const ids = new Set<string>();

  for (const day of days) {
    for (const session of day.sessions) {
      for (const block of session.blocks) {
        for (const schema of block.schemas) {
          for (const row of schema.rows) {
            collectRowExerciseIds(row, ids);
          }
        }
      }
    }
  }

  return [...ids];
};

export const loadTargetDays = async (
  planId: string,
  startDate: Date,
  dayOfWeek: DayOfWeek | undefined,
): Promise<MobilePublishDayPayload[]> => {
  const dayFilter = dayOfWeek === undefined ? {} : { dayOfWeek: DAY_OF_WEEK_TO_PRISMA[dayOfWeek] };

  return prisma.day.findMany({
    where: { week: { planId, startDate }, ...dayFilter },
    include: MOBILE_PUBLISH_DAY_INCLUDE,
  });
};

export const loadExerciseById = async (days: MobilePublishDayPayload[]): Promise<ExerciseById> => {
  const ids = collectDayExerciseIds(days);

  if (ids.length === 0) {
    return new Map();
  }

  const exercises = await prisma.exercise.findMany({ where: { id: { in: ids } } });

  return new Map(exercises.map((exercise) => [exercise.id, mapToExercise(exercise)]));
};

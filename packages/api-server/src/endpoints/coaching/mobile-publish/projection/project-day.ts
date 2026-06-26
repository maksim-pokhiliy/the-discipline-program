import { type Block } from "@repo/contracts/lms/block";
import { type ExerciseById } from "@repo/contracts/lms/row-text";

import { type LegacyDailyProgram } from "../../../../infrastructure/legacy-mobile";
import { mapToBlockWithSchemas } from "../../../../mappers/lms";
import { type MobilePublishDayPayload } from "../day-include";

import { buildSchemaEntry } from "./format-legacy-schema";

const TRAINING_NUMBER_OFFSET = 1;
const BLOCK_NAME_FALLBACK = "";

type LegacyDayTraining = LegacyDailyProgram["dayTrainings"][number];
type LegacyBlock = LegacyDayTraining["blocks"][number];

export type LegacyDailyProgramResult =
  | { isRestDay: true }
  | { isRestDay: false; dailyProgram: LegacyDailyProgram };

const isRestDay = (day: MobilePublishDayPayload): boolean => day.label?.rest === true;

const projectBlock = (block: Block, exerciseById: ExerciseById): LegacyBlock => ({
  name: block.labels[0]?.name ?? BLOCK_NAME_FALLBACK,
  exercises: block.schemas
    .map((schema) => buildSchemaEntry(schema, block, exerciseById))
    .filter((entry) => entry !== ""),
});

const projectSession = (
  session: MobilePublishDayPayload["sessions"][number],
  index: number,
  exerciseById: ExerciseById,
): LegacyDayTraining => ({
  trainingNumber: index + TRAINING_NUMBER_OFFSET,
  blocks: session.blocks
    .map((block) => mapToBlockWithSchemas(block))
    .map((block) => projectBlock(block, exerciseById)),
});

export const projectDay = (
  day: MobilePublishDayPayload,
  exerciseById: ExerciseById,
): LegacyDailyProgramResult => {
  if (isRestDay(day)) {
    return { isRestDay: true };
  }

  return {
    isRestDay: false,
    dailyProgram: {
      dayTrainings: day.sessions.map((session, index) =>
        projectSession(session, index, exerciseById),
      ),
    },
  };
};

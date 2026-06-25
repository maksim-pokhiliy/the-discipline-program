import { type Block } from "@repo/contracts/lms/block";
import { type ExerciseById, renderRowLine } from "@repo/contracts/lms/row-text";
import { type SchemaWithBody } from "@repo/contracts/lms/schema";

import { type LegacyDailyProgram } from "../../../../infrastructure/legacy-mobile";
import { mapToBlockWithSchemas } from "../../../../mappers/lms";
import { type MobilePublishDayPayload } from "../day-include";

const TRAINING_NUMBER_OFFSET = 1;
const BLOCK_NAME_FALLBACK = "";

type LegacyDayTraining = LegacyDailyProgram["dayTrainings"][number];
type LegacyBlock = LegacyDayTraining["blocks"][number];

export type LegacyDailyProgramResult =
  | { isRestDay: true }
  | { isRestDay: false; dailyProgram: LegacyDailyProgram };

const isRestDay = (day: MobilePublishDayPayload): boolean => day.label?.rest === true;

const projectSchemaRows = (
  schema: SchemaWithBody,
  block: Block,
  exerciseById: ExerciseById,
): string[] =>
  schema.rows.map((row) =>
    renderRowLine(row, exerciseById, {
      blockIntensity: block.intensity,
      schemaIntensity: schema.schema.intensity,
    }),
  );

const projectBlock = (block: Block, exerciseById: ExerciseById): LegacyBlock => ({
  name: block.labels[0]?.name ?? BLOCK_NAME_FALLBACK,
  exercises: block.schemas.flatMap((schema) => projectSchemaRows(schema, block, exerciseById)),
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

import { type BlockType } from "@repo/contracts/lms/block-type";
import { type DayType } from "@repo/contracts/lms/day-type";
import { type Exercise } from "@repo/contracts/lms/exercise";
import { type SchemeType } from "@repo/contracts/lms/scheme-type";

export const buildExerciseMap = (exercises: Exercise[]): ReadonlyMap<string, Exercise> => {
  const map: Map<string, Exercise> = new Map();

  for (const exercise of exercises) {
    map.set(exercise.id, exercise);
  }

  return map;
};

export const buildBlockTypeMap = (blockTypes: BlockType[]): ReadonlyMap<string, BlockType> => {
  const map: Map<string, BlockType> = new Map();

  for (const blockType of blockTypes) {
    map.set(blockType.id, blockType);
  }

  return map;
};

export const buildSchemeTypeMap = (schemeTypes: SchemeType[]): ReadonlyMap<string, SchemeType> => {
  const map: Map<string, SchemeType> = new Map();

  for (const schemeType of schemeTypes) {
    map.set(schemeType.id, schemeType);
  }

  return map;
};

export const buildDayTypeMap = (dayTypes: DayType[]): ReadonlyMap<string, DayType> => {
  const map: Map<string, DayType> = new Map();

  for (const dayType of dayTypes) {
    map.set(dayType.id, dayType);
  }

  return map;
};

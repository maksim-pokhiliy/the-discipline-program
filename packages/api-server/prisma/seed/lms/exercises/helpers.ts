import {
  type BodyPart,
  type Modality,
  type MovementPattern,
  type SkillLevel,
} from "@prisma/client";

import { type ExerciseDefaultMetrics } from "@repo/contracts/lms/exercise-library-item";

export interface ExerciseSeed {
  name: string;
  nameAliases: string[];
  description: string;
  primaryMovement: MovementPattern;
  modality: Modality;
  equipment: string[];
  primaryBodyParts: BodyPart[];
  secondaryBodyParts: BodyPart[];
  skillLevel: SkillLevel;
  defaultMetrics: ExerciseDefaultMetrics;
  isBenchmark: boolean;
}

export const METRICS_LOAD_REPS: ExerciseDefaultMetrics = {
  canMeasureLoad: true,
  canMeasureReps: true,
  canMeasureDuration: false,
  canMeasureDistance: false,
  canMeasureCalories: false,
};

export const METRICS_REPS_ONLY: ExerciseDefaultMetrics = {
  canMeasureLoad: false,
  canMeasureReps: true,
  canMeasureDuration: false,
  canMeasureDistance: false,
  canMeasureCalories: false,
};

export const METRICS_REPS_DURATION: ExerciseDefaultMetrics = {
  canMeasureLoad: false,
  canMeasureReps: true,
  canMeasureDuration: true,
  canMeasureDistance: false,
  canMeasureCalories: false,
};

export const METRICS_DURATION_ONLY: ExerciseDefaultMetrics = {
  canMeasureLoad: false,
  canMeasureReps: false,
  canMeasureDuration: true,
  canMeasureDistance: false,
  canMeasureCalories: false,
};

export const METRICS_LOAD_DURATION: ExerciseDefaultMetrics = {
  canMeasureLoad: true,
  canMeasureReps: false,
  canMeasureDuration: true,
  canMeasureDistance: false,
  canMeasureCalories: false,
};

export const METRICS_CARDIO_FULL: ExerciseDefaultMetrics = {
  canMeasureLoad: false,
  canMeasureReps: false,
  canMeasureDuration: true,
  canMeasureDistance: true,
  canMeasureCalories: true,
};

export const METRICS_LOAD_DISTANCE: ExerciseDefaultMetrics = {
  canMeasureLoad: true,
  canMeasureReps: false,
  canMeasureDuration: true,
  canMeasureDistance: true,
  canMeasureCalories: false,
};

interface LoadedExerciseInput {
  name: string;
  nameAliases?: string[];
  description: string;
  primaryMovement: MovementPattern;
  equipment?: string[];
  primaryBodyParts: BodyPart[];
  secondaryBodyParts?: BodyPart[];
  skillLevel: SkillLevel;
  isBenchmark?: boolean;
}

export const barbellExercise = (input: LoadedExerciseInput): ExerciseSeed => ({
  name: input.name,
  nameAliases: input.nameAliases ?? [],
  description: input.description,
  primaryMovement: input.primaryMovement,
  modality: "BARBELL",
  equipment: input.equipment ?? ["barbell"],
  primaryBodyParts: input.primaryBodyParts,
  secondaryBodyParts: input.secondaryBodyParts ?? [],
  skillLevel: input.skillLevel,
  defaultMetrics: METRICS_LOAD_REPS,
  isBenchmark: input.isBenchmark ?? false,
});

export const dumbbellExercise = (input: LoadedExerciseInput): ExerciseSeed => ({
  name: input.name,
  nameAliases: input.nameAliases ?? [],
  description: input.description,
  primaryMovement: input.primaryMovement,
  modality: "DUMBBELL",
  equipment: input.equipment ?? ["dumbbell"],
  primaryBodyParts: input.primaryBodyParts,
  secondaryBodyParts: input.secondaryBodyParts ?? [],
  skillLevel: input.skillLevel,
  defaultMetrics: METRICS_LOAD_REPS,
  isBenchmark: input.isBenchmark ?? false,
});

export const kettlebellExercise = (input: LoadedExerciseInput): ExerciseSeed => ({
  name: input.name,
  nameAliases: input.nameAliases ?? [],
  description: input.description,
  primaryMovement: input.primaryMovement,
  modality: "KETTLEBELL",
  equipment: input.equipment ?? ["kettlebell"],
  primaryBodyParts: input.primaryBodyParts,
  secondaryBodyParts: input.secondaryBodyParts ?? [],
  skillLevel: input.skillLevel,
  defaultMetrics: METRICS_LOAD_REPS,
  isBenchmark: input.isBenchmark ?? false,
});

interface BodyweightInput {
  name: string;
  nameAliases?: string[];
  description: string;
  primaryMovement: MovementPattern;
  equipment?: string[];
  primaryBodyParts: BodyPart[];
  secondaryBodyParts?: BodyPart[];
  skillLevel: SkillLevel;
  metrics?: ExerciseDefaultMetrics;
  isBenchmark?: boolean;
}

export const bodyweightExercise = (input: BodyweightInput): ExerciseSeed => ({
  name: input.name,
  nameAliases: input.nameAliases ?? [],
  description: input.description,
  primaryMovement: input.primaryMovement,
  modality: "BODYWEIGHT",
  equipment: input.equipment ?? [],
  primaryBodyParts: input.primaryBodyParts,
  secondaryBodyParts: input.secondaryBodyParts ?? [],
  skillLevel: input.skillLevel,
  defaultMetrics: input.metrics ?? METRICS_REPS_ONLY,
  isBenchmark: input.isBenchmark ?? false,
});

interface CardioInput {
  name: string;
  nameAliases?: string[];
  description: string;
  primaryMovement: MovementPattern;
  equipment: string[];
  primaryBodyParts: BodyPart[];
  secondaryBodyParts?: BodyPart[];
  skillLevel: SkillLevel;
  isBenchmark?: boolean;
}

export const cardioExercise = (input: CardioInput): ExerciseSeed => ({
  name: input.name,
  nameAliases: input.nameAliases ?? [],
  description: input.description,
  primaryMovement: input.primaryMovement,
  modality: "CARDIO",
  equipment: input.equipment,
  primaryBodyParts: input.primaryBodyParts,
  secondaryBodyParts: input.secondaryBodyParts ?? [],
  skillLevel: input.skillLevel,
  defaultMetrics: METRICS_CARDIO_FULL,
  isBenchmark: input.isBenchmark ?? false,
});

import type {
  Intensity,
  Load,
  PerLimbDistribution,
  RepNotation,
} from "@repo/contracts/lms/_shared";

import type { ExerciseFormValue } from "../components/exercise-form-draft.types";

import type { ComposeRow } from "./compose-tree.types";
import { buildSeedRow } from "./lib/seed-build";

type ExerciseDraftInput = {
  exercise: ExerciseFormValue;
  reps?: RepNotation;
  load?: Load;
  side?: PerLimbDistribution | null;
  intensity?: Intensity | null;
  notes?: string;
};

const DEFAULT_REPS: RepNotation = { kind: "count", value: 10 };
const DEFAULT_LOAD: Load = { kind: "unspecified" };

export const atomicExercise = (exerciseId: string): ExerciseFormValue => ({
  form: "atomic",
  exerciseId,
});

export const compoundExercise = (
  elements: { exerciseId: string; reps: RepNotation }[],
): ExerciseFormValue => ({
  form: "compound",
  compound: { elements },
});

export const exerciseRow = (idSeed: string, input: ExerciseDraftInput): ComposeRow =>
  buildSeedRow(idSeed, "EXERCISE", {
    exercise: input.exercise,
    reps: input.reps ?? DEFAULT_REPS,
    load: input.load ?? DEFAULT_LOAD,
    side: input.side ?? null,
    tempo: null,
    position: null,
    intensity: input.intensity ?? null,
    notes: input.notes ?? "",
  });

export const restRow = (idSeed: string, valueSec: number, notes?: string): ComposeRow =>
  buildSeedRow(idSeed, "REST", {
    parsed: { duration: { value: valueSec, unit: "sec" }, scope: "between_rounds" },
    raw: `${valueSec} sec`,
    notes: notes ?? "",
  });

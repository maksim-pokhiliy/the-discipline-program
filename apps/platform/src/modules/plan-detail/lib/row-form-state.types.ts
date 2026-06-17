import type {
  Intensity,
  Load,
  PerLimbDistribution,
  RepNotation,
  RestSpec,
} from "@repo/contracts/lms/_shared";

export type RowFormState = {
  exerciseId: string | null;
  sets: number | null;
  reps: RepNotation | null;
  load: Load | null;
  side: PerLimbDistribution | null;
  tempoInput: string;
  modifierIds: string[];
  notes: string[];
  intensity: Intensity | null;
  rest: RestSpec | null;
};

export type RowRequestMode = { kind: "create"; schemaId: string } | { kind: "edit" };
